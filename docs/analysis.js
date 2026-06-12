const dataVersion = "2026-06-12-coverage-matrix-v1";
const dataUrl = "./data/programs.json";
const governmentsUrl = "./data/governments.json";
const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";

const topicSelect = document.getElementById("analysis-topic-select");
const partySelect = document.getElementById("analysis-party-select");
const matchSelect = document.getElementById("analysis-match-select");
const topicCards = document.getElementById("analysis-topic-cards");
const coverageMatrix = document.getElementById("coverage-matrix");
const resultsView = document.getElementById("analysis-results");
const resultsSummary = document.getElementById("analysis-results-summary");
const filterTitle = document.getElementById("analysis-filter-title");
const filterSummary = document.getElementById("analysis-filter-summary");
const statusTopics = document.getElementById("analysis-status-topics");
const statusTexts = document.getElementById("analysis-status-texts");
const statusPrograms = document.getElementById("analysis-status-programs");

let state = {
  topics: [],
  suggestions: [],
  programsData: { parties: [], programs: [] },
  governmentsData: { parties: [], governments: [] },
};

function withVersion(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${dataVersion}`;
}

async function init() {
  const [taxonomyResponse, suggestionsResponse, programsResponse, governmentsResponse] = await Promise.all([
    fetch(withVersion(taxonomyUrl)),
    fetch(withVersion(suggestionsUrl)),
    fetch(withVersion(dataUrl)),
    fetch(withVersion(governmentsUrl)),
  ]);

  if (!taxonomyResponse.ok || !suggestionsResponse.ok || !programsResponse.ok || !governmentsResponse.ok) {
    throw new Error("Kunne ikke hente analysefilerne.");
  }

  const taxonomy = await taxonomyResponse.json();
  const suggestions = await suggestionsResponse.json();
  const programsData = await programsResponse.json();
  const governmentsData = await governmentsResponse.json();

  state = {
    topics: taxonomy.topics,
    suggestions,
    programsData,
    governmentsData,
  };

  renderStatusStrip();
  renderTopicOptions();
  renderPartyOptions();
  renderTopicCards();
  renderCoverageMatrix();

  topicSelect.addEventListener("change", renderAll);
  partySelect.addEventListener("change", renderAll);
  matchSelect.addEventListener("change", renderAll);

  renderAll();
}

function renderStatusStrip() {
  const sourceCount = state.programsData.programs.length + state.governmentsData.governments.length;
  statusTopics.textContent = String(state.topics.length);
  statusTexts.textContent = String(state.suggestions.length);
  statusPrograms.textContent = String(sourceCount);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTopicOptions() {
  topicSelect.innerHTML = [
    '<option value="all" selected>Alle emner</option>',
    ...state.topics.map((topic) => `<option value="${topic.id}">${topic.label}</option>`),
  ].join("");
}

function renderPartyOptions() {
  const parties = Array.from(new Set(state.suggestions.map((item) => item.party_name))).sort((a, b) =>
    a.localeCompare(b, "da")
  );

  partySelect.innerHTML = [
    '<option value="all" selected>Alle kilder</option>',
    ...parties.map((party) => `<option value="${party}">${party}</option>`),
  ].join("");
}

function countByPrimaryTopic(topicId) {
  return state.suggestions.filter((item) => item.primary_topic_id === topicId).length;
}

function hasTopicSignal(item, topicId) {
  return (item.topic_signals || []).some((signal) => signal.topic_id === topicId);
}

function renderTopicCards() {
  topicCards.innerHTML = state.topics
    .map((topic) => {
      const count = countByPrimaryTopic(topic.id);
      return `
        <article class="overview-card">
          <h3>${topic.label}</h3>
          <p class="meta">${count} tekststykker</p>
          <p class="context">${topic.description}</p>
          <div class="tag-row">
            ${topic.keywords.slice(0, 5).map((keyword) => `<span class="tag">${keyword}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function getTopicLabel(topicId) {
  return state.topics.find((topic) => topic.id === topicId)?.label ?? topicId;
}

function topicShortLabel(topic) {
  const label = topic.label.split(",")[0].replace(" og ", " + ");
  return label.length > 18 ? `${label.slice(0, 17)}…` : label;
}

function getPartyName(partyId) {
  return state.programsData.parties.find((party) => party.id === partyId)?.name ?? partyId;
}

function getSourceRows() {
  const programRows = state.programsData.programs.map((program) => ({
    id: program.id,
    type: "party_program",
    typeLabel: "Program",
    name: `${getPartyName(program.partyId)} ${program.year}`,
    title: program.title,
    year: Number(program.year),
    group: getPartyName(program.partyId),
    url: `./program.html?program=${encodeURIComponent(program.id)}`,
  }));

  const governmentRows = state.governmentsData.governments.map((government) => ({
    id: government.id,
    type: "government_basis",
    typeLabel: "Regering",
    name: `${government.year} · ${government.title}`,
    title: government.governmentName || government.typeLabel,
    year: Number(government.year),
    group: "Regeringsgrundlag",
    url: `./program.html?government=${encodeURIComponent(government.id)}`,
  }));

  return [...programRows, ...governmentRows].sort((a, b) => {
    if (a.type !== b.type) return a.type === "party_program" ? -1 : 1;
    return a.group.localeCompare(b.group, "da") || a.year - b.year || a.name.localeCompare(b.name, "da");
  });
}

function getCoverageBySource() {
  const coverage = new Map();
  for (const item of state.suggestions) {
    if (!coverage.has(item.program_id)) coverage.set(item.program_id, new Map());
    const sourceCoverage = coverage.get(item.program_id);

    for (const signal of item.topic_signals || []) {
      if (!sourceCoverage.has(signal.topic_id)) {
        sourceCoverage.set(signal.topic_id, { primary: 0, secondary: 0, broad: 0 });
      }
      const cell = sourceCoverage.get(signal.topic_id);
      if (item.primary_topic_id === signal.topic_id) {
        cell.primary += 1;
      } else if (item.secondary_topic_id === signal.topic_id) {
        cell.secondary += 1;
      } else {
        cell.broad += 1;
      }
    }
  }
  return coverage;
}

function coverageClass(cell) {
  if (!cell) return "coverage-none";
  const total = cell.primary + cell.secondary + cell.broad;
  if (cell.primary >= 4 || total >= 8) return "coverage-strong";
  if (cell.primary >= 2 || total >= 4) return "coverage-medium";
  return "coverage-weak";
}

function renderCoverageCell(cell, topicLabel) {
  if (!cell) {
    return `<td class="coverage-cell coverage-none" title="${escapeHtml(topicLabel)}: ikke identificeret">·</td>`;
  }
  const supplemental = cell.secondary + cell.broad;
  const label = `${topicLabel}: ${cell.primary} primære, ${cell.secondary} sekundære, ${cell.broad} brede`;
  return `
    <td class="coverage-cell ${coverageClass(cell)}" title="${escapeHtml(label)}">
      <span class="coverage-primary">${cell.primary || ""}</span>
      ${supplemental ? `<span class="coverage-supplement">+${supplemental}</span>` : ""}
    </td>
  `;
}

function renderCoverageMatrix() {
  const rows = getSourceRows();
  const coverage = getCoverageBySource();
  const headers = state.topics
    .map(
      (topic) =>
        `<th scope="col" title="${escapeHtml(topic.label)}"><span>${escapeHtml(topicShortLabel(topic))}</span></th>`
    )
    .join("");

  coverageMatrix.innerHTML = `
    <table class="coverage-table">
      <thead>
        <tr>
          <th scope="col" class="coverage-source-head">Kilde</th>
          ${headers}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => {
            const rowCoverage = coverage.get(row.id) || new Map();
            return `
              <tr>
                <th scope="row" class="coverage-source">
                  <a href="${row.url}">${escapeHtml(row.name)}</a>
                  <span>${escapeHtml(row.typeLabel)} · ${escapeHtml(row.title)}</span>
                </th>
                ${state.topics
                  .map((topic) => renderCoverageCell(rowCoverage.get(topic.id), topic.label))
                  .join("")}
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function filterSuggestions() {
  const selectedTopic = topicSelect.value;
  const selectedParty = partySelect.value;
  const matchMode = matchSelect.value;

  return state.suggestions.filter((item) => {
    const topicMatch =
      selectedTopic === "all" ||
      item.primary_topic_id === selectedTopic ||
      (matchMode === "primary_secondary" && item.secondary_topic_id === selectedTopic) ||
      (matchMode === "topic_signals" && hasTopicSignal(item, selectedTopic));
    const partyMatch = selectedParty === "all" || item.party_name === selectedParty;

    return topicMatch && partyMatch;
  });
}

function renderAll() {
  const items = filterSuggestions();
  const selectedTopic = topicSelect.value;
  const selectedParty = partySelect.value;
  const matchMode = matchSelect.value;

  const topicLabel = selectedTopic === "all" ? "Alle emner" : getTopicLabel(selectedTopic);
  const partyLabel = selectedParty === "all" ? "alle kilder" : selectedParty;

  filterTitle.textContent = topicLabel;
  filterSummary.textContent = `Viser ${items.length} tekststykker for ${partyLabel}.`;
  resultsSummary.textContent =
    matchMode === "topic_signals"
      ? `Viser ${items.length} tekstforslag. Alle tydelige emnesignaler er medtaget, så brede afsnit kan optræde under flere emner.`
      : matchMode === "primary_secondary"
      ? `Viser ${items.length} tekstforslag. Sekundære emner er medtaget som supplerende signaler.`
      : `Viser ${items.length} tekstforslag, hvor det valgte emne er det primære emne.`;

  if (items.length === 0) {
    resultsView.innerHTML = '<div class="empty">Ingen tekststykker matcher den aktuelle filtrering.</div>';
    return;
  }

  resultsView.innerHTML = items
    .slice(0, 180)
    .map(
      (item) => `
        <article class="analysis-card">
          <div class="analysis-card-head">
            <div>
              <h3>${escapeHtml(item.party_name)} · ${escapeHtml(item.year)}</h3>
              <p class="meta">${escapeHtml(item.title)} · Tekst-id ${escapeHtml(item.chunk_id)}</p>
            </div>
            <div class="analysis-badges">
              <span class="tag">Primært: ${escapeHtml(item.primary_topic_label)}</span>
              ${
                item.secondary_topic_label
                  ? `<span class="tag analysis-tag-alt">Sekundært: ${escapeHtml(item.secondary_topic_label)}</span>`
                  : ""
              }
            </div>
          </div>
          <p class="context">${escapeHtml(item.text)}</p>
        </article>
      `
    )
    .join("");
}

init().catch((error) => {
  resultsView.innerHTML = '<div class="empty">Kunne ikke indlæse analysevisningen.</div>';
  console.error(error);
});
