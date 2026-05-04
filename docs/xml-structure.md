# XML Structure

This document defines the structure of the generated main source XML.

The purpose of the XML is to store all available calendar information from the EHC Sursee My Ice Hockey club calendar in a normalized, searchable and reusable format.

The XML is the central data source for later scripts, for example:

- HTML list or calendar views
- Team-specific views
- Training-group-specific views
- iCalendar / ICS feeds
- filtered XML exports
- dynamic calendar links

## Main XML file

The generated file is stored here:

```text
data/main-source.xml
```

The public GitHub Pages URL is:

```text
https://tludoni1.github.io/mih-club-calendar/data/main-source.xml
```

The XML is generated from the public My Ice Hockey club calendar:

```text
https://app.myice.hockey/clubschedulepublic.php?cid=88&lid=1
```

The API endpoint used by the generator is:

```text
https://app.myice.hockey/inc/processclubplanningpublic.php
```

## Root element

The root element is:

```xml
<calendar>
```

Example:

```xml
<calendar
  source_url="https://app.myice.hockey/clubschedulepublic.php?cid=88&amp;lid=1"
  api_url="https://app.myice.hockey/inc/processclubplanningpublic.php"
  source_type="public_club_schedule_api"
  club_id="88"
  language_id="1"
  exported_at="2026-05-04T21:47:50.703Z"
  start_date="2025-05-04"
  end_date="2027-05-04"
  event_count="235">
```

## Root attributes

| Attribute | Meaning |
|---|---|
| `source_url` | Public My Ice Hockey club calendar URL. |
| `api_url` | API endpoint used to fetch calendar data. |
| `source_type` | Internal source description. Current value: `public_club_schedule_api`. |
| `club_id` | My Ice Hockey club ID. Current value: `88`. |
| `language_id` | My Ice Hockey language ID. Current value: `1`. |
| `exported_at` | Timestamp when the XML was generated. ISO 8601 UTC format. |
| `start_date` | First date included in the export. Format: `YYYY-MM-DD`. |
| `end_date` | Last date included in the export. Format: `YYYY-MM-DD`. |
| `event_count` | Number of unique events written into the XML. |

## XML structure overview

```xml
<calendar>
  <events>
    <event>
      ...
    </event>
  </events>
</calendar>
```

All calendar entries are stored below:

```xml
<events>
```

Each individual calendar entry is stored as:

```xml
<event>
```

## Event structure

Each event contains normalized fields, source fields and the original raw JSON.

Example structure:

```xml
<event>
  <id>751366</id>
  <uid>mih-88-ac6cff922fe4274f807b0528@ehc-sursee.local</uid>

  <type_event>P</type_event>
  <event>Training</event>
  <title>Training</title>

  <agegroup>U14-U16</agegroup>
  <agegroup_id>143</agegroup_id>

  <team></team>
  <team_id></team_id>

  <practice_group>U14 Sommertraining</practice_group>
  <practice_group_id>14238</practice_group_id>

  <category>U14 Sommertraining</category>
  <category_id>14238</category_id>

  <mapping_status>mapped</mapping_status>

  <type>Trockentraining</type>
  <type_id>P1</type_id>

  <opponent></opponent>

  <date>2026-05-04</date>
  <weekday>Mo</weekday>
  <time_start>17:15</time_start>
  <time_end>18:30</time_end>
  <datetime_start>2026-05-04T17:15:00+02:00</datetime_start>
  <datetime_end>2026-05-04T18:30:00+02:00</datetime_end>

  <place>Eishalle Sursee - Kraftraum</place>
  <location_id>2293</location_id>

  <notes></notes>
  <description></description>

  <url></url>

  <source_fields>
    ...
  </source_fields>

  <raw>
    <raw_json>...</raw_json>
  </raw>
</event>
```

## Normalized event fields

| Field | Meaning |
|---|---|
| `id` | My Ice Hockey event ID. |
| `uid` | Stable generated UID for ICS/calendar use. |
| `type_event` | Main event type. Example: `P`, `GH`, `GA`. |
| `event` | Main event label. Example: `Training`, `Spiel`. |
| `title` | Normalized title. Usually same as `event`. |
| `agegroup` | Age group label. Example: `U14-U16`, `U18-U21`, `Aktiv`. |
| `agegroup_id` | My Ice Hockey age group ID. |
| `team` | Team name for games. Empty for trainings. |
| `team_id` | My Ice Hockey team ID for games. Empty for trainings. |
| `practice_group` | Practice group name for trainings. Empty for games. |
| `practice_group_id` | My Ice Hockey practice group ID for trainings. Empty for games. |
| `category` | Generic category name. For trainings this is the practice group. For games this is the team. |
| `category_id` | Generic category ID. For trainings this is the practice group ID. For games this is the team ID. |
| `mapping_status` | Shows how the team/group mapping was resolved. |
| `type` | Detail type label. Example: `Eistraining`, `Trockentraining`, `Freundschaft`. |
| `type_id` | Detail type ID. Example: `P1`, `P2`, `G1`, `G3`. |
| `opponent` | Opponent name for games. Empty for trainings. |
| `date` | Date in `YYYY-MM-DD` format. |
| `weekday` | Weekday abbreviation from MIH. Example: `Mo`, `Di`, `Fr`. |
| `time_start` | Start time in `HH:MM` format. |
| `time_end` | End time in `HH:MM` format. |
| `datetime_start` | Start datetime in ISO-like format with Europe/Zurich offset. |
| `datetime_end` | End datetime in ISO-like format with Europe/Zurich offset. |
| `place` | Location label. |
| `location_id` | My Ice Hockey location ID. |
| `notes` | Notes from MIH, trimmed. |
| `description` | Description from MIH, if available. |
| `url` | Event URL, if available. |

## Main event types

| `type_event` | Meaning |
|---|---|
| `P` | Training |
| `GH` | Heimspiel |
| `GA` | Auswärtsspiel |

## Detail type IDs

Training detail types:

| `type_id` | Meaning |
|---|---|
| `P1` | Trockentraining |
| `P2` | Eistraining |
| `P3` | Krafttraining |
| `P4` | Team Event |
| `P5` | Theorie |
| `P6` | Spezial |
| `P7` | Import |

Game detail types:

| `type_id` | Meaning |
|---|---|
| `G1` | Freundschaft |
| `G2` | Turnier |
| `G3` | Saison |
| `G4` | Play-Off |
| `G5` | Play-Out |
| `G6` | 1. Phase |
| `G7` | 2. Phase |
| `G8` | Event |
| `G9` | Keine |

## Known age groups

The following age groups are currently known from the public MIH calendar page:

| `agegroup_id` | `agegroup` |
|---|---|
| `63` | Aktiv |
| `74` | Erfassungsstufe |
| `143` | U14-U16 |
| `144` | U18-U21 |

## Known locations

The following locations are currently known from the public MIH calendar page:

| `location_id` | `place` |
|---|---|
| `2293` | Eishalle Sursee - Kraftraum |
| `2294` | Eishalle Sursee - Tribüne |
| `2297` | Eishalle Sursee - Eisfeld |
| `2298` | Turnhalle Neufeld - Turnhalle |
| `2299` | Turnhalle St. Georg - Turnhalle |

## Training groups

For trainings, the XML uses:

```xml
<practice_group>...</practice_group>
<practice_group_id>...</practice_group_id>
```

For trainings, these fields are empty:

```xml
<team></team>
<team_id></team_id>
```

Example:

```xml
<type_event>P</type_event>

<agegroup>U18-U21</agegroup>
<agegroup_id>144</agegroup_id>

<team></team>
<team_id></team_id>

<practice_group>U18</practice_group>
<practice_group_id>14239</practice_group_id>

<category>U18</category>
<category_id>14239</category_id>
```

## Teams

For games, the XML uses:

```xml
<team>...</team>
<team_id>...</team_id>
```

For games, these fields are empty:

```xml
<practice_group></practice_group>
<practice_group_id></practice_group_id>
```

Example:

```xml
<type_event>GH</type_event>

<agegroup>U14-U16</agegroup>
<agegroup_id>143</agegroup_id>

<team>U14-Top</team>
<team_id>10324</team_id>

<practice_group></practice_group>
<practice_group_id></practice_group_id>

<category>U14-Top</category>
<category_id>10324</category_id>
```

## Category fields

The fields `category` and `category_id` are generic helper fields.

They contain:

| Event type | `category` | `category_id` |
|---|---|---|
| Training | Practice group name | Practice group ID |
| Game | Team name | Team ID |

This allows later scripts to filter or display both trainings and games with one generic field.

## Source fields

Each event contains a `source_fields` block.

Example:

```xml
<source_fields>
  <field name="id_event">751366</field>
  <field name="id_group">14238</field>
  <field name="notes"> </field>
  <field name="agegroup">U14-U16 (U14 Sommertraining)</field>
  <field name="type">Trockentraining</field>
  <field name="event">Training</field>
  <field name="type_event">P</field>
  <field name="place">Eishalle Sursee - Kraftraum</field>
  <field name="date">2026-05-04</field>
  <field name="weekday">Mo</field>
  <field name="start">2026-05-04 17:15:00</field>
  <field name="end">2026-05-04 18:30:00</field>
  <field name="time_start">17:15:00</field>
  <field name="time_end">18:30:00</field>
  <field name="type_type">P1</field>
  <field name="color">#81c881</field>
  <field name="opponent"></field>
</source_fields>
```

The `source_fields` block stores the original fields received from MIH as individual XML fields.

This is important so that no source information is lost, even if a field is not yet normalized into its own XML element.

## Raw JSON

Each event also contains the original raw JSON:

```xml
<raw>
  <raw_json>{...}</raw_json>
</raw>
```

The JSON is XML-escaped.

This field is mainly for debugging and future extension.

## Mapping logic

The XML generator normalizes the raw My Ice Hockey event data into stable XML fields.

The source API provides different information depending on the event type.

## Event type `P` — Training

For trainings, the source field `id_group` represents the practice group ID.

The source field `agegroup` can contain both the age group and the practice group name.

Example source value:

```text
U14-U16 (U14 Sommertraining)
```

This is normalized as:

```xml
<agegroup>U14-U16</agegroup>
<agegroup_id>143</agegroup_id>

<practice_group>U14 Sommertraining</practice_group>
<practice_group_id>14238</practice_group_id>

<category>U14 Sommertraining</category>
<category_id>14238</category_id>
```

If the practice group ID is known in the internal mapping table, the mapping status is:

```xml
<mapping_status>mapped</mapping_status>
```

If the practice group ID is not known, but the group name can be inferred from the MIH source value, the mapping status is:

```xml
<mapping_status>inferred_practice_group</mapping_status>
```

Example:

```text
U14-U16 (U14 Test)
```

is normalized as:

```xml
<agegroup>U14-U16</agegroup>
<agegroup_id>143</agegroup_id>

<practice_group>U14 Test</practice_group>
<practice_group_id>14287</practice_group_id>

<category>U14 Test</category>
<category_id>14287</category_id>

<mapping_status>inferred_practice_group</mapping_status>
```

## Event type `GH` / `GA` — Games

For games, the source field `id_group` represents the team ID.

If the source field `agegroup` contains a value like this:

```text
U14-U16 (U14-Top)
```

it is normalized as:

```xml
<agegroup>U14-U16</agegroup>
<agegroup_id>143</agegroup_id>

<team>U14-Top</team>
<team_id>10324</team_id>

<category>U14-Top</category>
<category_id>10324</category_id>
```

If the team name is not present in the source text, the generator falls back to the known team mapping table.

If the team ID is known in the internal mapping table, the mapping status is:

```xml
<mapping_status>mapped</mapping_status>
```

If the team ID is not known, but the team name can be inferred from the MIH source value, the mapping status is:

```xml
<mapping_status>inferred_team</mapping_status>
```

## Mapping status

Each event contains a `mapping_status` field.

Example:

```xml
<mapping_status>mapped</mapping_status>
```

The possible values are:

| Value | Meaning |
|---|---|
| `mapped` | The event group/team ID was found in the known mapping table or could be confirmed against it. |
| `inferred_practice_group` | A training group was not found in the static mapping table, but was successfully inferred from the MIH source text, for example `U14-U16 (U14 Test)`. |
| `inferred_team` | A team was not found in the static mapping table, but was successfully inferred from the MIH source text, for example `U14-U16 (U14-Top)`. |
| `unknown_practice_group_id` | The event is a training, but the practice group ID could not be mapped or inferred. |
| `unknown_team_id` | The event is a game, but the team ID could not be mapped or inferred. |
| `no_group_id` | The source event did not contain a usable group/team ID. |
| `not_applicable` | The event type does not clearly belong to training or game logic. |

The goal is that new practice groups or teams can be detected automatically whenever My Ice Hockey provides the information in the event source data.

## Current known practice groups

The following practice groups are currently known through the mapping table or through current XML data.

| `practice_group_id` | `agegroup` | `practice_group` |
|---|---|---|
| `15268` | Aktiv | 1. Mannschaft |
| `15269` | Aktiv | 2. Mannschaft |
| `15270` | Aktiv | Damen |
| `15271` | Aktiv | Senioren |
| `14189` | Erfassungsstufe | U12 |
| `14190` | Erfassungsstufe | U09 |
| `14235` | Erfassungsstufe | U07 Sommertraining |
| `14236` | Erfassungsstufe | U09 Sommertraining |
| `14237` | Erfassungsstufe | U11 Sommertraining |
| `14191` | U14-U16 | U14 |
| `14192` | U14-U16 | U16 |
| `14193` | U14-U16 | U14+U16 |
| `14194` | U14-U16 | Morgentraining |
| `14238` | U14-U16 | U14 Sommertraining |
| `14330` | U14-U16 | Torhüter (jüngere) |
| `14331` | U14-U16 | Torhüter (ältere) |
| `14239` | U18-U21 | U18 |
| `14240` | U18-U21 | U21 |

Additional inferred practice groups can appear automatically in the XML if MIH provides them in the source field `agegroup`.

## Current known teams

The following teams are currently known through the mapping table or through current XML data.

| `team_id` | `agegroup` | `team` |
|---|---|---|
| `10780` | Aktiv | 1. Mannschaft |
| `10781` | Aktiv | 2. Mannschaft |
| `10782` | Aktiv | Damen |
| `10783` | Aktiv | Senioren |
| `10318` | Erfassungsstufe | U09-1 |
| `10319` | Erfassungsstufe | U09-2 |
| `10321` | Erfassungsstufe | U12-1 |
| `10322` | Erfassungsstufe | U12-2 |
| `10323` | Erfassungsstufe | U12-3 |
| `10325` | U14-U16 | U14-A |
| `10324` | U14-U16 | U14-Top |
| `10326` | U14-U16 | U16-A I |
| `10327` | U14-U16 | U16-A II |
| `10328` | U18-U21 | U18-A |
| `10329` | U18-U21 | U21-A |

Additional inferred teams can appear automatically in the XML if MIH provides them in the source field `agegroup`.

## Dynamic calendar feed

A dynamic ICS calendar feed is generated outside GitHub Pages on a PHP-capable webserver.

Main endpoint:

```text
https://mih.raze.ch/kalender.php
```

The PHP endpoint reads the generated XML from GitHub Pages:

```text
https://tludoni1.github.io/mih-club-calendar/data/main-source.xml
```

It then filters events based on URL parameters and returns a valid ICS calendar feed.

Example:

```text
https://mih.raze.ch/kalender.php?practice_group_id=14239&team_id=10328&hide_past=true&name=U18
```

This example returns:

```text
U18 trainings + U18-A games
```

The dynamic ICS feed is intended for calendar subscriptions in tools such as Outlook, iPhone Calendar and Android calendar apps.

The feed should be subscribed to as an online calendar, not imported as a one-time ICS file, otherwise later XML updates will not be reflected automatically.

## Calendar link configurator

A browser-based calendar link configurator is available here:

```text
https://mih.raze.ch/
```

The configurator reads the current XML and builds calendar links by selecting available age groups, teams, practice groups, locations and event types.

This is important because new groups or teams may appear in future XML exports. The configurator should therefore use the XML as its source instead of hard-coded options.

## Calendar link documentation

The documentation for supported calendar parameters is available here:

```text
https://mih.raze.ch/readme.php
```

It documents the available URL parameters for `kalender.php`.

## Calendar feed parameters

| Parameter | Purpose |
|---|---|
| `practice_group_id` | Filter trainings by practice group ID. |
| `team_id` | Filter all games of selected teams. |
| `home_team_id` | Filter only home games of selected teams. |
| `away_team_id` | Filter only away games of selected teams. |
| `agegroup_id` | Filter by age group. |
| `category_id` | Filter by generic team/practice group category. |
| `location_id` | Filter by location. |
| `type_event` | Filter by main event type, for example `P`, `GH`, `GA`. |
| `type_id` | Filter by detailed event type, for example `P1`, `P2`, `G1`, `G3`. |
| `from` | Start date in `YYYY-MM-DD` format. |
| `to` | End date in `YYYY-MM-DD` format. |
| `hide_past` | If set to `true`, past events are excluded. |
| `name` | Calendar display name. |
| `debug` | If set to `true`, returns a text preview instead of ICS. |

## Calendar parameter examples

U18 trainings and U18-A games:

```text
https://mih.raze.ch/kalender.php?practice_group_id=14239&team_id=10328&hide_past=true&name=U18
```

U16 trainings and both U16 game teams:

```text
https://mih.raze.ch/kalender.php?practice_group_id=14192&team_id=10326,10327&hide_past=true&name=U16
```

Damen home games only:

```text
https://mih.raze.ch/kalender.php?home_team_id=10782&hide_past=true&name=Damen%20Heimspiele
```

Debug preview for a calendar link:

```text
https://mih.raze.ch/kalender.php?practice_group_id=14239&team_id=10328&hide_past=true&name=U18&debug=true
```

## Recommended workflow

The complete flow is:

```text
My Ice Hockey public calendar API
→ GitHub Action
→ data/main-source.xml
→ https://tludoni1.github.io/mih-club-calendar/data/main-source.xml
→ https://mih.raze.ch/kalender.php
→ Outlook / iPhone / Android calendar subscription
```

The XML remains the central source of truth.

The PHP calendar endpoint does not store events itself. It only reads the latest XML and dynamically generates filtered ICS feeds.

## Update schedule

The GitHub workflow updates the XML twice per day.

Current planned schedule:

```text
08:30
15:00
```

This avoids excessive requests to My Ice Hockey while still keeping the exported calendar reasonably current.

## Important design rules

- The XML should preserve all available event information.
- Normalized fields should be easy to search and filter.
- Original source fields must remain available in `source_fields`.
- Raw JSON must remain available in `raw_json`.
- New practice groups should be inferred automatically when MIH provides them in the `agegroup` source text.
- New teams should be inferred automatically when MIH provides them in the `agegroup` source text.
- If an event cannot be mapped or inferred, it must not be silently discarded.
- Unknown mappings must be visible through `mapping_status`.
- The PHP calendar feed should use the XML as source and should not maintain its own separate event database.
- The configurator should read available filter options from the XML and should not hard-code teams or practice groups.
