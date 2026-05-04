(function () {
  const DEFAULT_CONFIG = {
    xmlUrl: "/data/main-source.xml",
    templateBaseUrl: "/public/widget/templates",
    defaultTemplate: "list-short",
    defaultLimit: 20
  };

  function getScriptBaseUrl() {
    const scripts = document.getElementsByTagName("script");
    const currentScript = scripts[scripts.length - 1];

    if (!currentScript || !currentScript.src) {
      return "";
    }

    return currentScript.src.replace(/\/events-widget\.js(\?.*)?$/, "");
  }

  function buildDefaultUrls() {
    const scriptBaseUrl = getScriptBaseUrl();

    return {
      xmlUrl: scriptBaseUrl.replace(/\/public\/widget$/, "/data/main-source.xml"),
      templateBaseUrl: scriptBaseUrl + "/templates"
    };
  }

  function parseCsv(value) {
    if (!value) return [];

    return String(value)
      .split(",")
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function getText(parent, tagName) {
    const node = parent.getElementsByTagName(tagName)[0];
    return node ? node.textContent.trim() : "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";

    const parts = value.split("-");
    if (parts.length !== 3) return value;

    return parts[2] + "." + parts[1] + "." + parts[0];
  }

  function eventToObject(eventNode) {
    return {
      id: getText(eventNode, "id"),
      uid: getText(eventNode, "uid"),

      type_event: getText(eventNode, "type_event"),
      event: getText(eventNode, "event"),
      title: getText(eventNode, "title"),

      agegroup: getText(eventNode, "agegroup"),
      agegroup_id: getText(eventNode, "agegroup_id"),

      team: getText(eventNode, "team"),
      team_id: getText(eventNode, "team_id"),

      practice_group: getText(eventNode, "practice_group"),
      practice_group_id: getText(eventNode, "practice_group_id"),

      category: getText(eventNode, "category"),
      category_id: getText(eventNode, "category_id"),

      mapping_status: getText(eventNode, "mapping_status"),

      type: getText(eventNode, "type"),
      type_id: getText(eventNode, "type_id"),

      opponent: getText(eventNode, "opponent"),

      date: getText(eventNode, "date"),
      weekday: getText(eventNode, "weekday"),
      time_start: getText(eventNode, "time_start"),
      time_end: getText(eventNode, "time_end"),
      datetime_start: getText(eventNode, "datetime_start"),
      datetime_end: getText(eventNode, "datetime_end"),

      place: getText(eventNode, "place"),
      location_id: getText(eventNode, "location_id"),

      notes: getText(eventNode, "notes"),
      description: getText(eventNode, "description"),
      url: getText(eventNode, "url")
    };
  }

  function matchesAnyFilter(event, filters) {
    const activeFilters = [
      ["agegroup_id", filters.agegroupIds],
      ["team_id", filters.teamIds],
      ["practice_group_id", filters.practiceGroupIds],
      ["category_id", filters.categoryIds],
      ["location_id", filters.locationIds],
      ["type_event", filters.typeEvents],
      ["type_id", filters.typeIds]
    ].filter(function (entry) {
      return entry[1].length > 0;
    });

    if (activeFilters.length === 0) {
      return true;
    }

    return activeFilters.some(function (entry) {
      const field = entry[0];
      const values = entry[1];

      return values.indexOf(event[field]) !== -1;
    });
  }

  function matchesDateRange(event, filters) {
    if (filters.from && event.date < filters.from) {
      return false;
    }

    if (filters.to && event.date > filters.to) {
      return false;
    }

    return true;
  }

  function filterEvents(events, filters) {
    return events
      .filter(function (event) {
        return matchesAnyFilter(event, filters);
      })
      .filter(function (event) {
        return matchesDateRange(event, filters);
      })
      .sort(function (a, b) {
        return (a.date + a.time_start).localeCompare(b.date + b.time_start);
      })
      .slice(0, filters.limit);
  }

  function applyTemplate(template, data) {
    return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function (_, key) {
      if (key === "date") {
        return escapeHtml(formatDate(data.date));
      }

      return escapeHtml(data[key] || "");
    });
  }

  function readWidgetConfig(widget, defaults) {
    return {
      xmlUrl: widget.dataset.xmlUrl || defaults.xmlUrl,
      templateBaseUrl: widget.dataset.templateBaseUrl || defaults.templateBaseUrl,
      template: widget.dataset.template || DEFAULT_CONFIG.defaultTemplate,

      agegroupIds: parseCsv(widget.dataset.agegroupId),
      teamIds: parseCsv(widget.dataset.teamId),
      practiceGroupIds: parseCsv(widget.dataset.practiceGroupId),
      categoryIds: parseCsv(widget.dataset.categoryId),
      locationIds: parseCsv(widget.dataset.locationId),
      typeEvents: parseCsv(widget.dataset.typeEvent),
      typeIds: parseCsv(widget.dataset.typeId),

      from: widget.dataset.from || "",
      to: widget.dataset.to || "",
      limit: Number(widget.dataset.limit || DEFAULT_CONFIG.defaultLimit)
    };
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error("HTTP " + response.status + " for " + url);
    }

    return response.text();
  }

  async function renderWidget(widget, defaults) {
    const config = readWidgetConfig(widget, defaults);

    const xmlText = await fetchText(config.xmlUrl);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const eventNodes = Array.from(xmlDoc.getElementsByTagName("event"));
    const allEvents = eventNodes.map(eventToObject);
    const filteredEvents = filterEvents(allEvents, config);

    if (filteredEvents.length === 0) {
      widget.innerHTML = '<div class="ehcs-calendar-empty">Keine Termine gefunden.</div>';
      return;
    }

    const templateUrl = config.templateBaseUrl + "/" + config.template + ".html";
    const rowTemplateUrl = config.templateBaseUrl + "/" + config.template + "-row.html";

    const template = await fetchText(templateUrl);
    const rowTemplate = await fetchText(rowTemplateUrl);

    const rows = filteredEvents
      .map(function (event) {
        return applyTemplate(rowTemplate, event);
      })
      .join("");

    widget.innerHTML = template.replace("{{rows}}", rows);
  }

  async function init() {
    const detectedUrls = buildDefaultUrls();

    const defaults = {
      xmlUrl: detectedUrls.xmlUrl || DEFAULT_CONFIG.xmlUrl,
      templateBaseUrl: detectedUrls.templateBaseUrl || DEFAULT_CONFIG.templateBaseUrl
    };

    const widgets = Array.from(document.querySelectorAll(".ehcs-calendar-widget"));

    for (const widget of widgets) {
      try {
        await renderWidget(widget, defaults);
      } catch (error) {
        widget.innerHTML =
          '<div class="ehcs-calendar-error">Kalender konnte nicht geladen werden.</div>';
        console.error("EHC Sursee calendar widget error:", error);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
