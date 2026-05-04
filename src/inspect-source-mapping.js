const SOURCE_URL = "https://app.myice.hockey/clubschedulepublic.php?cid=88&lid=1";

function decodeHtml(value) {
  return String(value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function cleanLabel(value) {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAgegroupAndName(label) {
  const match = label.match(/^\(([^)]+)\)\s*(.+)$/);

  if (!match) {
    return {
      agegroup: "",
      name: label
    };
  }

  return {
    agegroup: match[1].trim(),
    name: match[2].trim()
  };
}

function extractMappings(html, attributeName) {
  const results = [];
  const regex = new RegExp(
    `<a\\b[^>]*data-agegroup="([^"]*)"[^>]*${attributeName}="([^"]*)"[^>]*>([\\s\\S]*?)<\\/a>`,
    "gi"
  );

  let match;

  while ((match = regex.exec(html)) !== null) {
    const agegroupId = match[1].trim();
    const id = match[2].trim();
    const label = cleanLabel(match[3]);
    const parsed = extractAgegroupAndName(label);

    results.push({
      id,
      agegroup_id: agegroupId,
      agegroup: parsed.agegroup,
      name: parsed.name,
      raw_label: label
    });
  }

  return results;
}

async function main() {
  console.log("Inspecting MIH public source mapping...");
  console.log(`Source: ${SOURCE_URL}`);

  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "EHC-Sursee-Calendar-Mapping-Inspector/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Source request failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  const practiceGroups = extractMappings(html, "data-pgroup");
  const teams = extractMappings(html, "data-team");

  console.log("");
  console.log(`Practice groups found: ${practiceGroups.length}`);
  console.log(`Teams found: ${teams.length}`);

  console.log("");
  console.log("Practice groups:");
  for (const item of practiceGroups) {
    console.log(
      `  ${item.id} | agegroup_id=${item.agegroup_id} | ${item.agegroup} | ${item.name}`
    );
  }

  console.log("");
  console.log("Teams:");
  for (const item of teams) {
    console.log(
      `  ${item.id} | agegroup_id=${item.agegroup_id} | ${item.agegroup} | ${item.name}`
    );
  }

  if (practiceGroups.length === 0 && teams.length === 0) {
    console.log("");
    console.log("Result:");
    console.log("No dynamic group/team mapping was found in the public source HTML.");
    console.log("In that case, the XML generator cannot fully replace the static mapping from this source alone.");
  }
}

main().catch((error) => {
  console.error("Inspection failed:");
  console.error(error);
  process.exit(1);
});
