const dataVersion = "2026-06-11-topic-signals-v1";
const dataUrl = "./data/programs.json";
const governmentsUrl = "./data/governments.json";
const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";
const similarityUrl = "./data/analysis/government_similarity.json";
const chunksUrl = "./data/analysis/chunks.json";

const compareTopicSelect = document.getElementById("compare-topic-select");
const comparePeriodSelect = document.getElementById("compare-period-select");
const compareProgramScopeSelect = document.getElementById("compare-program-scope-select");
const comparePartyCheckboxes = document.getElementById("compare-party-checkboxes");
const compareGovernmentCheckboxes = document.getElementById("compare-government-checkboxes");
const timelinePartySelect = document.getElementById("timeline-party-select");
const timelineTopicSelect = document.getElementById("timeline-topic-select");
const timelinePeriodSelect = document.getElementById("timeline-period-select");
const partyOverviewSelect = document.getElementById("party-overview-select");
const partyPeriodSelect = document.getElementById("party-period-select");
const governmentSelect = document.getElementById("government-select");
const governmentTopicSelect = document.getElementById("government-topic-select");
const governmentPeriodSelect = document.getElementById("government-period-select");
const searchInput = document.getElementById("search-input");
const searchSourceSelect = document.getElementById("search-source-select");
const searchPartySelect = document.getElementById("search-party-select");
const searchPeriodSelect = document.getElementById("search-period-select");

const compareView = document.getElementById("compare-view");
const timelineView = document.getElementById("timeline-view");
const partyView = document.getElementById("party-view");
const governmentView = document.getElementById("government-view");
const searchView = document.getElementById("search-view");
const compareSummary = document.getElementById("compare-summary");
const timelineSummary = document.getElementById("timeline-summary");
const partySummary = document.getElementById("party-summary");
const governmentSummary = document.getElementById("government-summary");
const searchSummary = document.getElementById("search-summary");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const modePanels = Array.from(document.querySelectorAll(".mode-panel"));
const statusParties = document.getElementById("status-parties");
const statusPrograms = document.getElementById("status-programs");
const statusGovernments = document.getElementById("status-governments");
const statusTopics = document.getElementById("status-topics");

let state = {
  topics: [],
  parties: [],
  programs: [],
  governments: [],
  governmentParties: [],
  suggestions: [],
  similarities: [],
  chunks: [],
};

const periods = [
  { id: "all", label: "Alle perioder", start: 0, end: 9999 },
  { id: "pre_1973", label: "Før jordskredsvalget (1955-1972)", start: 1955, end: 1972 },
  { id: "1973_1989", label: "Jordskred og ny blokpolitik (1973-1989)", start: 1973, end: 1989 },
  { id: "1990_2000", label: "1990'erne og midterregeringer (1990-2000)", start: 1990, end: 2000 },
  { id: "2001_2010", label: "VK/DF-perioden (2001-2010)", start: 2001, end: 2010 },
  { id: "2011_2019", label: "Efter finanskrisen (2011-2019)", start: 2011, end: 2019 },
  { id: "2020_now", label: "Nutid og nye partier (2020-2026)", start: 2020, end: 2026 },
];

function withVersion(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${dataVersion}`;
}

async function init() {
  const [dataResponse, governmentsResponse, taxonomyResponse, suggestionsResponse, similarityResponse, chunksResponse] =
    await Promise.all([
      fetch(withVersion(dataUrl)),
      fetch(withVersion(governmentsUrl)),
      fetch(withVersion(taxonomyUrl)),
      fetch(withVersion(suggestionsUrl)),
      fetch(withVersion(similarityUrl)),
      fetch(withVersion(chunksUrl)),
    ]);

  if (
    !dataResponse.ok ||
    !governmentsResponse.ok ||
    !taxonomyResponse.ok ||
    !suggestionsResponse.ok ||
    !similarityResponse.ok ||
    !chunksResponse.ok
  ) {
    throw new Error("Kunne ikke hente alle datafiler.");
  }

  const data = await dataResponse.json();
  const governmentsData = await governmentsResponse.json();
  const taxonomy = await taxonomyResponse.json();
  const suggestions = await suggestionsResponse.json();
  const similarities = await similarityResponse.json();
  const chunks = await chunksResponse.json();

  state = {
    ...data,
    topics: taxonomy.topics,
    governments: governmentsData.governments,
    governmentParties: governmentsData.parties,
    suggestions,
    similarities,
    chunks,
  };

  renderStatusStrip();
  renderTopicOptions(compareTopicSelect);
  renderTopicOptions(timelineTopicSelect);
  renderTopicOptions(governmentTopicSelect);
  renderPeriodOptions(comparePeriodSelect);
  renderPeriodOptions(timelinePeriodSelect);
  renderPeriodOptions(partyPeriodSelect);
  renderPeriodOptions(governmentPeriodSelect);
  renderPeriodOptions(searchPeriodSelect);
  renderPartyCheckboxes();
  renderGovernmentCheckboxes();
  renderPartyOptions(timelinePartySelect);
  renderPartyOptions(partyOverviewSelect);
  renderGovernmentOptions(governmentSelect);
  renderSearchPartyOptions();

  compareTopicSelect.addEventListener("change", renderAll);
  comparePeriodSelect.addEventListener("change", renderAll);
  compareProgramScopeSelect.addEventListener("change", renderAll);
  timelinePartySelect.addEventListener("change", renderAll);
  timelineTopicSelect.addEventListener("change", renderAll);
  timelinePeriodSelect.addEventListener("change", renderAll);
  partyOverviewSelect.addEventListener("change", renderAll);
  partyPeriodSelect.addEventListener("change", renderAll);
  governmentSelect.addEventListener("change", renderAll);
  governmentTopicSelect.addEventListener("change", renderAll);
  governmentPeriodSelect.addEventListener("change", renderAll);
  searchInput.addEventListener("input", renderAll);
  searchSourceSelect.addEventListener("change", renderAll);
  searchPartySelect.addEventListener("change", renderAll);
  searchPeriodSelect.addEventListener("change", renderAll);
  comparePartyCheckboxes.addEventListener("change", renderAll);
  compareGovernmentCheckboxes.addEventListener("change", renderAll);

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  renderAll();
}

function renderStatusStrip() {
  if (statusParties) statusParties.textContent = String(state.parties.length);
  if (statusPrograms) statusPrograms.textContent = String(state.programs.length);
  if (statusGovernments) statusGovernments.textContent = String(state.governments.length);
  if (statusTopics) statusTopics.textContent = String(state.topics.length);
}

function setMode(mode) {
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });

  modePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `mode-${mode}`);
  });
}

function renderTopicOptions(selectElement) {
  selectElement.innerHTML = state.topics
    .map((topic, index) => {
      const selected = index === 0 ? "selected" : "";
      return `<option value="${escapeHtml(topic.id)}" ${selected}>${escapeHtml(topic.label)}</option>`;
    })
    .join("");
}

function renderPartyOptions(selectElement) {
  selectElement.innerHTML = state.parties
    .map((party, index) => {
      const selected = index === 0 ? "selected" : "";
      return `<option value="${escapeHtml(party.id)}" ${selected}>${escapeHtml(party.name)}</option>`;
    })
    .join("");
}

function renderGovernmentOptions(selectElement) {
  selectElement.innerHTML = [...state.governments]
    .sort((a, b) => b.year - a.year)
    .map((government, index) => {
      const selected = index === 0 ? "selected" : "";
      return `<option value="${escapeHtml(government.id)}" ${selected}>${government.year} · ${escapeHtml(
        government.title
      )}</option>`;
    })
    .join("");
}

function renderPeriodOptions(selectElement) {
  if (!selectElement) return;
  selectElement.innerHTML = periods
    .map((period) => `<option value="${period.id}">${escapeHtml(period.label)}</option>`)
    .join("");
}

function renderSearchPartyOptions() {
  const names = Array.from(new Set(state.chunks.map((chunk) => chunk.party_name))).sort((a, b) =>
    a.localeCompare(b, "da")
  );
  searchPartySelect.innerHTML = [
    '<option value="all" selected>Alle partier og regeringsgrundlag</option>',
    ...names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
  ].join("");
}

function renderPartyCheckboxes() {
  comparePartyCheckboxes.innerHTML = state.parties
    .map(
      (party, index) => `
      <label class="party-choice" style="${partyStyle(party.id)}">
        <input type="checkbox" value="${escapeHtml(party.id)}" ${index < 3 ? "checked" : ""} />
        ${renderPartySwatchById(party.id)}
        <span>${escapeHtml(party.name)}</span>
      </label>
    `
    )
    .join("");
}

function renderGovernmentCheckboxes() {
  compareGovernmentCheckboxes.innerHTML = [...state.governments]
    .sort((a, b) => b.year - a.year)
    .map(
      (government, index) => `
      <label>
        <input type="checkbox" value="${escapeHtml(government.id)}" ${index === 0 ? "checked" : ""} />
        <span>${government.year} · ${escapeHtml(government.typeLabel)}</span>
      </label>
    `
    )
    .join("");
}

function getSelectedPartyIds() {
  return Array.from(comparePartyCheckboxes.querySelectorAll("input:checked")).map(
    (input) => input.value
  );
}

function getSelectedGovernmentIds() {
  return Array.from(compareGovernmentCheckboxes.querySelectorAll("input:checked")).map(
    (input) => input.value
  );
}

function getTopicLabel(topicId) {
  return state.topics.find((topic) => topic.id === topicId)?.label ?? topicId;
}

function getPeriod(periodId) {
  return periods.find((period) => period.id === periodId) ?? periods[0];
}

function getPeriodLabel(periodId) {
  return getPeriod(periodId).label;
}

function isInPeriod(year, periodId) {
  const period = getPeriod(periodId);
  const numericYear = Number(year);
  return numericYear >= period.start && numericYear <= period.end;
}

function getPartyName(partyId) {
  return state.parties.find((party) => party.id === partyId)?.name ?? getGovernmentPartyName(partyId);
}

function getPartyMeta(partyId) {
  return (
    state.parties.find((party) => party.id === partyId) ??
    state.governmentParties.find((party) => party.id === partyId) ?? {
      id: partyId,
      name: partyId,
      color: "#14583f",
      colorSoft: "#e0f0e9",
      shortName: partyId,
    }
  );
}

function getPartyMetaByName(name) {
  return (
    state.parties.find((party) => party.name === name) ??
    state.governmentParties.find((party) => party.name === name) ?? {
      name,
      color: "#14583f",
      colorSoft: "#e0f0e9",
      shortName: name?.slice(0, 2) ?? "",
    }
  );
}

function partyStyle(partyId) {
  const meta = getPartyMeta(partyId);
  return `--party-color: ${escapeHtml(meta.color || "#14583f")}; --party-soft: ${escapeHtml(
    meta.colorSoft || "#e0f0e9"
  )};`;
}

function partyStyleByName(name) {
  const meta = getPartyMetaByName(name);
  return `--party-color: ${escapeHtml(meta.color || "#14583f")}; --party-soft: ${escapeHtml(
    meta.colorSoft || "#e0f0e9"
  )};`;
}

function renderPartySwatchById(partyId) {
  const meta = getPartyMeta(partyId);
  return `<span class="party-swatch" style="${partyStyle(partyId)}" aria-hidden="true">${escapeHtml(
    meta.shortName || partyId
  )}</span>`;
}

function renderPartySwatchByName(name) {
  const meta = getPartyMetaByName(name);
  return `<span class="party-swatch" style="${partyStyleByName(name)}" aria-hidden="true">${escapeHtml(
    meta.shortName || String(name).slice(0, 2)
  )}</span>`;
}

function getGovernmentPartyName(partyId) {
  return state.governmentParties.find((party) => party.id === partyId)?.name ?? partyId;
}

function getLatestProgramYear(partyId) {
  const years = state.programs
    .filter((program) => program.partyId === partyId)
    .map((program) => Number(program.year));

  return years.length ? Math.max(...years) : 0;
}

function getProgramStatus(program) {
  return Number(program.year) === getLatestProgramYear(program.partyId) ? "current" : "historical";
}

function getCurrentProgramForParty(partyId) {
  return [...state.programs]
    .filter((program) => program.partyId === partyId)
    .sort((a, b) => Number(b.year) - Number(a.year))[0];
}

function getProgramsForCompare(partyId, periodId, scope) {
  const partyPrograms = state.programs.filter((program) => program.partyId === partyId);
  if (scope === "current") {
    const currentProgram = getCurrentProgramForParty(partyId);
    return currentProgram ? [currentProgram] : [];
  }
  if (scope === "period") {
    return partyPrograms.filter((program) => isInPeriod(program.year, periodId));
  }
  return partyPrograms;
}

function getProgramStatusLabel(program) {
  return getProgramStatus(program) === "current" ? "Aktuelt program" : "Historisk program";
}

function renderProgramStatus(program) {
  const status = getProgramStatus(program);
  return `<span class="program-status program-status-${status}">${getProgramStatusLabel(program)}</span>`;
}

function renderProgramType(program) {
  if (!program.programTypeLabel) return "";
  return `<p class="meta"><strong>Dokumenttype:</strong> ${escapeHtml(program.programTypeLabel)}</p>`;
}

function getGovernmentStatus(government) {
  const latestYear = Math.max(...state.governments.map((item) => Number(item.year)));
  return Number(government.year) === latestYear ? "current" : "historical";
}

function renderGovernmentStatus(government) {
  const status = getGovernmentStatus(government);
  const label = status === "current" ? "Aktuelt regeringsgrundlag" : "Historisk regeringsgrundlag";
  return `<span class="program-status program-status-${status}">${label}</span>`;
}

function getProgramUrl(program) {
  return `./program.html?program=${encodeURIComponent(program.id)}`;
}

function getGovernmentUrl(government) {
  return `./program.html?government=${encodeURIComponent(government.id)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHref(value) {
  return encodeURI(String(value ?? ""));
}

function getProgramTopicSuggestions(programId, topicId) {
  return state.suggestions
    .filter((item) => item.program_id === programId && getTopicMatchInfo(item, topicId))
    .sort((a, b) => {
      const matchA = getTopicMatchInfo(a, topicId);
      const matchB = getTopicMatchInfo(b, topicId);
      return (matchA.order - matchB.order) || a.chunk_id.localeCompare(b.chunk_id, "da");
    });
}

function getTopicMatchInfo(item, topicId) {
  if (item.primary_topic_id === topicId) {
    return { basis: "primary", label: "Primært emne", order: 1 };
  }
  if (item.secondary_topic_id === topicId) {
    return { basis: "secondary", label: "Sekundært emnesignal", order: 2 };
  }
  const signal = (item.topic_signals || []).find((entry) => entry.topic_id === topicId);
  if (signal) {
    return { basis: "topic_signal", label: "Bredt emnesignal", order: 3 };
  }
  return null;
}

function getTopicLabelsForProgram(program) {
  const topicIds = new Set(
    state.suggestions.flatMap((item) => {
      if (item.program_id !== program.id) return [];
      return (item.topic_signals?.length ? item.topic_signals.map((signal) => signal.topic_id) : [item.primary_topic_id]);
    })
  );

  return Array.from(topicIds)
    .map((topicId) => getTopicLabel(topicId))
    .sort((a, b) => a.localeCompare(b, "da"));
}

function renderSourceLink(program) {
  if (!program.externalUrl) return "";
  return `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`;
}

function renderPdfLink(source) {
  if (!source.sourcePath) return "";
  return `<p class="meta"><a href="${escapeHref(source.sourcePath)}" target="_blank" rel="noreferrer">Åbn original PDF</a></p>`;
}

function renderMetadataLink(source) {
  const links = [];
  if (source.metadataUrl) {
    links.push(`<a href="${source.metadataUrl}" target="_blank" rel="noreferrer">Metadata fra Statsministeriet</a>`);
  }
  if (source.basisSourceUrl) {
    links.push(`<a href="${source.basisSourceUrl}" target="_blank" rel="noreferrer">Kilde til parlamentarisk grundlag</a>`);
  }
  return links.length ? `<p class="meta">${links.join(" · ")}</p>` : "";
}

function renderFullTextLink(program) {
  return `<p class="meta"><a href="${getProgramUrl(program)}">Læs hele programmet</a></p>`;
}

function renderGovernmentFullTextLink(government) {
  return `<p class="meta"><a href="${getGovernmentUrl(government)}">Læs hele dokumentet</a></p>`;
}

function renderContext(program) {
  if (!program.context) return "";
  return `<p class="context">${escapeHtml(program.context)}</p>`;
}

function renderPartyTags(ids, emptyText = "Ikke særskilt registreret") {
  if (!ids || ids.length === 0) return `<span class="tag analysis-tag-alt">${escapeHtml(emptyText)}</span>`;
  return ids
    .map(
      (id) =>
        `<span class="tag party-tag" style="${partyStyle(id)}">${renderPartySwatchById(id)}${escapeHtml(
          getGovernmentPartyName(id)
        )}</span>`
    )
    .join("");
}

function renderExcerpts(suggestions, topicId, limit = 2) {
  const topicLabel = getTopicLabel(topicId);

  return suggestions
    .slice(0, limit)
    .map((suggestion) => {
      const match = getTopicMatchInfo(suggestion, topicId);
      const primaryLabel = suggestion.primary_topic_label && suggestion.primary_topic_id !== topicId
        ? ` · Primært klassificeret som ${escapeHtml(suggestion.primary_topic_label)}`
        : "";
      return `
        <div class="excerpt-block">
          <p class="excerpt">${escapeHtml(suggestion.text)}</p>
          <p class="meta">${escapeHtml(topicLabel)} · ${escapeHtml(match?.label || "Emnematch")}${primaryLabel} · Tekst-id ${escapeHtml(suggestion.chunk_id)}</p>
        </div>
      `;
    })
    .join("");
}

function getSourceTitle(chunk) {
  if (chunk.source_type === "government_basis") {
    const government = state.governments.find((item) => item.id === chunk.program_id);
    return government ? `${government.year} · ${government.title}` : `${chunk.year} · ${chunk.title}`;
  }
  const program = state.programs.find((item) => item.id === chunk.program_id);
  return program ? `${program.year} · ${program.title}` : `${chunk.year} · ${chunk.title}`;
}

function getSourceUrlById(sourceId, sourceType) {
  if (sourceType === "government_basis") {
    return `./program.html?government=${encodeURIComponent(sourceId)}`;
  }
  return `./program.html?program=${encodeURIComponent(sourceId)}`;
}

function getChunkSuggestion(chunkId) {
  return state.suggestions.find((item) => item.chunk_id === chunkId);
}

function highlightSearch(text, query) {
  const escapedText = escapeHtml(text);
  const cleaned = String(query || "").trim();
  if (cleaned.length < 2) return escapedText;
  const escapedQuery = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapedText.replace(new RegExp(`(${escapedQuery})`, "gi"), "<mark>$1</mark>");
}

function renderSearch() {
  if (!searchView) return;
  const query = searchInput.value.trim();
  const sourceType = searchSourceSelect.value;
  const partyName = searchPartySelect.value;
  const periodId = searchPeriodSelect.value;

  if (query.length < 2) {
    searchSummary.textContent = "Skriv mindst to tegn for at søge i alle tekststykker.";
    searchView.innerHTML = '<div class="empty">Søg fx på Folkeskole, ældrepleje, udlændinge eller landdistrikter.</div>';
    return;
  }

  const normalizedQuery = query.toLocaleLowerCase("da-DK");
  const matches = state.chunks
    .filter((chunk) => {
      const typeMatch = sourceType === "all" || chunk.source_type === sourceType;
      const partyMatch = partyName === "all" || chunk.party_name === partyName;
      const periodMatch = isInPeriod(chunk.year, periodId);
      const textMatch = chunk.text.toLocaleLowerCase("da-DK").includes(normalizedQuery);
      return typeMatch && partyMatch && periodMatch && textMatch;
    })
    .sort((a, b) => a.year - b.year || a.party_name.localeCompare(b.party_name, "da") || a.chunk_index - b.chunk_index);

  searchSummary.textContent = `${matches.length} tekststykker matcher "${query}" i ${getPeriodLabel(
    periodId
  )}. Viser de første 80.`;

  if (matches.length === 0) {
    searchView.innerHTML = '<div class="empty">Ingen tekststykker matcher søgningen. Prøv et kortere ord eller fjern et filter.</div>';
    return;
  }

  searchView.innerHTML = matches
    .slice(0, 80)
    .map((chunk) => {
      const suggestion = getChunkSuggestion(chunk.chunk_id);
      const sourceLabel = chunk.source_type === "government_basis" ? "Regeringsgrundlag" : "Partiprogram";
      return `
        <article class="analysis-card search-card party-accent-card" style="${partyStyleByName(chunk.party_name)}">
          <div class="analysis-card-head">
            <div>
              <p class="section-kicker">${escapeHtml(sourceLabel)}</p>
              <h3>${renderPartySwatchByName(chunk.party_name)}${escapeHtml(chunk.party_name)} · ${chunk.year}</h3>
              <p class="meta">${escapeHtml(getSourceTitle(chunk))} · Tekst-id ${escapeHtml(chunk.chunk_id)}</p>
            </div>
            <div class="analysis-badges">
              ${
                suggestion
                  ? `<span class="tag">Primært: ${escapeHtml(suggestion.primary_topic_label)}</span>${
                      suggestion.secondary_topic_label
                        ? `<span class="tag analysis-tag-alt">Sekundært: ${escapeHtml(suggestion.secondary_topic_label)}</span>`
                        : ""
                    }`
                  : '<span class="tag analysis-tag-alt">Ikke emneklassificeret</span>'
              }
            </div>
          </div>
          <p class="context">${highlightSearch(chunk.text, query)}</p>
          <p class="meta"><a href="${getSourceUrlById(chunk.program_id, chunk.source_type)}">Åbn fuld kilde</a></p>
        </article>
      `;
    })
    .join("");
}

function formatPercent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatSimilarity(value) {
  return (Number(value) || 0).toLocaleString("da-DK", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function renderTopicTags(program) {
  const labels = getTopicLabelsForProgram(program);
  if (labels.length === 0) return '<p class="meta">Ingen emneforslag endnu.</p>';

  return `
    <div class="tag-row">
      ${labels.slice(0, 8).map((label) => `<span class="tag">${escapeHtml(label)}</span>`).join("")}
      ${labels.length > 8 ? `<span class="tag analysis-tag-alt">+${labels.length - 8} emner</span>` : ""}
    </div>
  `;
}

function renderAll() {
  renderCompare(
    compareTopicSelect.value,
    getSelectedPartyIds(),
    getSelectedGovernmentIds(),
    comparePeriodSelect.value,
    compareProgramScopeSelect.value
  );
  renderTimeline(timelineTopicSelect.value, timelinePartySelect.value, timelinePeriodSelect.value);
  renderPartyOverview(partyOverviewSelect.value, partyPeriodSelect.value);
  renderGovernmentOverview(governmentSelect.value, governmentTopicSelect.value, governmentPeriodSelect.value);
  renderSearch();
}

function renderCompare(topicId, partyIds, governmentIds, periodId, programScope) {
  compareView.innerHTML = "";

  if (!topicId) {
    compareView.innerHTML = '<div class="empty">Vælg et emne for at starte.</div>';
    compareSummary.textContent = "";
    return;
  }

  if (partyIds.length === 0 && governmentIds.length === 0) {
    compareView.innerHTML = '<div class="empty">Vælg mindst ét parti eller regeringsgrundlag.</div>';
    compareSummary.textContent = "";
    return;
  }

  const visibleGovernmentIds = governmentIds.filter((governmentId) => {
    const government = state.governments.find((item) => item.id === governmentId);
    return government && isInPeriod(government.year, periodId);
  });
  const partyCards = partyIds
    .map((partyId) => renderPartyCompareCard(partyId, topicId, periodId, programScope))
    .join("");
  const governmentCards = visibleGovernmentIds
    .map((governmentId) => renderGovernmentCompareCard(governmentId, topicId))
    .join("");

  const scopeLabel =
    programScope === "current"
      ? "aktuelle partiprogrammer"
      : programScope === "period"
      ? "partiprogrammer fra perioden"
      : "alle partiprogrammer";
  compareSummary.textContent = `${getTopicLabel(topicId)} · ${getPeriodLabel(periodId)} · ${scopeLabel} · ${
    partyIds.length
  } partier · ${visibleGovernmentIds.length} regeringsgrundlag`;
  compareView.innerHTML = partyCards + governmentCards;
}

function renderPartyCompareCard(partyId, topicId, periodId, programScope) {
  const programs = getProgramsForCompare(partyId, periodId, programScope)
    .map((program) => ({
      ...program,
      topicSuggestions: getProgramTopicSuggestions(program.id, topicId),
    }))
    .filter((program) => program.topicSuggestions.length > 0)
    .sort((a, b) => a.year - b.year);

  if (programs.length === 0) {
    return `
      <article class="party-card party-accent-card" style="${partyStyle(partyId)}">
        <h3>${renderPartySwatchById(partyId)}${escapeHtml(getPartyName(partyId))}</h3>
        <p class="empty">Ingen tydelige emnesignaler for ${escapeHtml(getTopicLabel(topicId))} i det valgte programudsnit. Prøv alle programmer eller brug fritekstsøgning.</p>
      </article>
    `;
  }

  const programBlocks = programs
    .map(
      (program) => `
        <section class="program-block">
          <p class="meta"><strong>${program.year}</strong> · ${escapeHtml(program.title)} ${renderProgramStatus(
        program
      )}</p>
          ${renderProgramType(program)}
          ${renderContext(program)}
          ${renderExcerpts(program.topicSuggestions, topicId, 2)}
          <p class="meta">Kilde: ${escapeHtml(program.sourceFile)}</p>
          ${renderSourceLink(program)}
          ${renderFullTextLink(program)}
        </section>
      `
    )
    .join("");

  return `
    <article class="party-card party-accent-card" style="${partyStyle(partyId)}">
      <p class="section-kicker">Parti</p>
      <h3>${renderPartySwatchById(partyId)}${escapeHtml(getPartyName(partyId))}</h3>
      ${programBlocks}
    </article>
  `;
}

function renderGovernmentCompareCard(governmentId, topicId) {
  const government = state.governments.find((item) => item.id === governmentId);
  if (!government) return "";
  const suggestions = getProgramTopicSuggestions(government.id, topicId);
  return `
    <article class="party-card government-card">
      <p class="section-kicker">Regeringsgrundlag</p>
      <h3>${government.year} · ${escapeHtml(government.title)} ${renderGovernmentStatus(government)}</h3>
      <p class="meta">${escapeHtml(government.typeLabel)} · ${escapeHtml(government.governmentName)}</p>
      ${renderGovernmentMeta(government)}
      ${suggestions.length ? renderExcerpts(suggestions, topicId, 3) : '<p class="empty">Ingen tydelige emnesignaler for dette emne i dokumentet.</p>'}
      ${renderGovernmentFullTextLink(government)}
      ${renderPdfLink(government)}
      ${renderMetadataLink(government)}
    </article>
  `;
}

function renderTimeline(topicId, partyId, periodId) {
  timelineView.innerHTML = "";

  if (!topicId || !partyId) {
    timelineView.innerHTML = '<div class="empty">Vælg emne og parti for tidsvisning.</div>';
    timelineSummary.textContent = "";
    return;
  }

  const programs = state.programs
    .filter((program) => program.partyId === partyId && isInPeriod(program.year, periodId))
    .map((program) => ({
      ...program,
      topicSuggestions: getProgramTopicSuggestions(program.id, topicId),
    }))
    .filter((program) => program.topicSuggestions.length > 0)
    .sort((a, b) => a.year - b.year);

  timelineSummary.textContent = `Parti: ${getPartyName(partyId)} · Emne: ${getTopicLabel(
    topicId
  )} · ${getPeriodLabel(periodId)}`;

  if (programs.length === 0) {
    timelineView.innerHTML = '<div class="empty">Ingen tydelige emnesignaler for valgt emne og parti.</div>';
    return;
  }

  timelineView.innerHTML = programs
    .map(
      (program) => `
      <article class="timeline-item">
        <div class="timeline-marker" aria-hidden="true"></div>
        <div class="timeline-content party-accent-card" style="${partyStyle(program.partyId)}">
          <h3>${renderPartySwatchById(program.partyId)}${program.year} · ${escapeHtml(
        program.title
      )} ${renderProgramStatus(program)}</h3>
          ${renderProgramType(program)}
          ${renderContext(program)}
          ${renderExcerpts(program.topicSuggestions, topicId, 3)}
          <p class="meta">Kilde: ${escapeHtml(program.sourceFile)}</p>
          ${renderSourceLink(program)}
          ${renderFullTextLink(program)}
        </div>
      </article>
    `
    )
    .join("");
}

function renderPartyOverview(partyId, periodId) {
  partyView.innerHTML = "";

  if (!partyId) {
    partyView.innerHTML = '<div class="empty">Vælg et parti for at se oversigten.</div>';
    partySummary.textContent = "";
    return;
  }

  const programs = state.programs
    .filter((program) => program.partyId === partyId && isInPeriod(program.year, periodId))
    .sort((a, b) => a.year - b.year);

  const programLabel = programs.length === 1 ? "program" : "programmer";
  partySummary.textContent = `${getPartyName(partyId)} · ${getPeriodLabel(periodId)} · ${programs.length} ${programLabel} er tilgængelige.`;

  if (programs.length === 0) {
    partyView.innerHTML = '<div class="empty">Ingen programmer lagt ind for dette parti endnu.</div>';
    return;
  }

  const timelineNav = `
    <div class="program-nav" aria-label="Programmer i tid">
      <div class="program-nav-head">
        <p class="section-kicker">Programlinje</p>
        <p class="meta">Klik på et program for at åbne den fulde tekst.</p>
      </div>
      <div class="mini-timeline">
      ${programs
        .map(
          (program) => `
          <a class="mini-timeline-item" href="${getProgramUrl(program)}">
            <span class="mini-year">${program.year}</span>
            <span class="mini-title">${escapeHtml(program.title)}</span>
            ${renderProgramStatus(program)}
          </a>
        `
        )
        .join("")}
      </div>
    </div>
  `;

  const cards = programs
    .map(
      (program) => `
      <article class="overview-card party-accent-card" style="${partyStyle(program.partyId)}">
        <div class="overview-head">
          <h3>${renderPartySwatchById(program.partyId)}${program.year} · ${escapeHtml(
        program.title
      )} ${renderProgramStatus(program)}</h3>
        </div>
        ${renderProgramType(program)}
        ${renderContext(program)}
        ${renderTopicTags(program)}
        <p class="meta">Kilde: ${escapeHtml(program.sourceFile)}</p>
        ${renderSourceLink(program)}
        ${renderFullTextLink(program)}
      </article>
    `
    )
    .join("");

  partyView.innerHTML = `
    ${timelineNav}
    <div class="program-detail-section">
      <div class="program-detail-head">
        <p class="section-kicker">Programmer og emneforslag</p>
        <h3>Programkort</h3>
        <p class="meta">Hvert kort viser kilde, kontekst og de emner, hvor der er fundet tydelige tekststykker.</p>
      </div>
      <div class="overview-grid">${cards}</div>
    </div>
  `;
}

function renderGovernmentOverview(governmentId, topicId, periodId) {
  if (!governmentView) return;
  const governmentsInPeriod = state.governments
    .filter((item) => isInPeriod(item.year, periodId))
    .sort((a, b) => b.year - a.year);
  const selectedGovernment = state.governments.find((item) => item.id === governmentId);
  const government =
    selectedGovernment && isInPeriod(selectedGovernment.year, periodId)
      ? selectedGovernment
      : governmentsInPeriod[0];
  if (!government) {
    governmentView.innerHTML = '<div class="empty">Ingen regeringsgrundlag i den valgte periode.</div>';
    governmentSummary.textContent = "";
    return;
  }

  const suggestions = getProgramTopicSuggestions(government.id, topicId);
  const topicLabel = getTopicLabel(topicId);
  governmentSummary.textContent = `${government.year} · ${government.title} · ${topicLabel} · ${getPeriodLabel(periodId)}`;

  const archiveLinks = governmentsInPeriod
    .map(
      (item) => `
        <a class="mini-timeline-item" href="${getGovernmentUrl(item)}">
          <span class="mini-year">${item.year}</span>
          <span class="mini-title">${escapeHtml(item.title)}</span>
          <span class="meta">${escapeHtml(item.typeLabel)}</span>
        </a>
      `
    )
    .join("");

  governmentView.innerHTML = `
    <article class="overview-card government-focus">
      <p class="section-kicker">Valgt regeringsgrundlag</p>
      <h3>${government.year} · ${escapeHtml(government.title)} ${renderGovernmentStatus(government)}</h3>
      <p class="meta">${escapeHtml(government.typeLabel)} · ${escapeHtml(government.governmentName)}</p>
      ${renderGovernmentMeta(government)}
      ${government.note ? `<p class="context">${escapeHtml(government.note)}</p>` : ""}
      ${renderGovernmentFullTextLink(government)}
      ${renderPdfLink(government)}
      ${renderMetadataLink(government)}
    </article>

    <section class="program-detail-section">
      <div class="program-detail-head">
        <p class="section-kicker">Emne</p>
        <h3>${escapeHtml(topicLabel)}</h3>
        <p class="meta">Tekststykker hvor regeringsgrundlaget matcher emnet som primært, sekundært eller bredt emnesignal.</p>
      </div>
      ${suggestions.length ? renderExcerpts(suggestions, topicId, 5) : '<div class="empty">Ingen tydelige emnesignaler for dette emne i dokumentet.</div>'}
    </section>

    <section class="program-detail-section">
      <div class="program-detail-head">
        <p class="section-kicker">Metodisk indikator</p>
        <h3>Relativ tekstlig nærhed til partier</h3>
        <p class="meta">Indikatoren sammenligner regeringstekstens emnepassager med aktuelle partiprogrammer. Primære emnetekster bruges direkte; sekundære og brede emnesignaler kan indgå med lavere vægt. Manglende emnetekst vises særskilt.</p>
      </div>
      ${renderSimilarityBars(government.id, topicId)}
    </section>

    <section class="program-nav" aria-label="Kildearkiv for regeringsgrundlag">
      <div class="program-nav-head">
        <p class="section-kicker">Kildearkiv</p>
        <p class="meta">Åbn et grundlag for fuld tekst og kildeoplysninger.</p>
      </div>
      <div class="mini-timeline">${archiveLinks}</div>
    </section>
  `;
}

function renderGovernmentMeta(government) {
  return `
    <div class="meta-block">
      <p class="meta"><strong>Statsminister:</strong> ${escapeHtml(government.primeMinister || "Ukendt")}</p>
      <p class="meta"><strong>Periode:</strong> ${escapeHtml(government.period || "Ukendt")}</p>
      <p class="meta"><strong>Regering:</strong></p>
      <div class="tag-row compact-tags">${renderPartyTags(government.governmentParties)}</div>
      <p class="meta"><strong>Parlamentarisk grundlag:</strong></p>
      <div class="tag-row compact-tags">${renderPartyTags(government.parliamentaryBasis)}</div>
    </div>
    ${renderContext(government)}
  `;
}

function renderSimilarityBars(governmentId, topicId) {
  const row = state.similarities.find(
    (item) => item.government_id === governmentId && item.topic_id === topicId
  );
  if (!row) {
    return '<div class="empty">Ingen beregning for dette udsnit endnu.</div>';
  }

  const unavailable = row.unavailable_topic_parties || [];
  if (row.scores.length === 0) {
    return `
      <div class="empty">${escapeHtml(row.note || "Ingen beregning for dette udsnit endnu.")}</div>
      ${renderUnavailableTopicParties(unavailable)}
      ${renderMissingParties(row.missing_party_ids)}
    `;
  }

  return `
    <div class="similarity-list">
      ${row.scores
        .map((score) => {
          const share = Number(score.relative_similarity_share ?? score.share ?? 0);
          const pct = formatPercent(share);
          const metricLabel = score.match_basis === "primary" ? "Cosinus" : "Vægtet cosinus";
          return `
            <div class="similarity-row">
              <div class="similarity-row-head">
                <span>${renderPartySwatchById(score.party_id)}<strong>${escapeHtml(score.party_name)}</strong> · ${escapeHtml(score.role)}</span>
                <span>Relativ nærhed ${pct}</span>
              </div>
              <div class="similarity-bar" aria-label="${escapeHtml(score.party_name)} ${pct}">
                <span style="width: ${pct}; background: ${escapeHtml(getPartyMeta(score.party_id).color || '#14583f')}"></span>
              </div>
              <p class="meta">${escapeHtml(score.match_label || "Primært emne")} · ${metricLabel} ${formatSimilarity(score.similarity)} · Sammenlignet med ${score.program_year} · ${escapeHtml(score.program_title)}</p>
            </div>
          `;
        })
        .join("")}
      <p class="meta method-note">${escapeHtml(row.note || "")}</p>
      ${renderUnavailableTopicParties(unavailable)}
      ${renderMissingParties(row.missing_party_ids)}
    </div>
  `;
}

function renderUnavailableTopicParties(items = []) {
  if (!items.length) return "";
  return `
    <div class="missing-topic-box">
      <p class="section-kicker">Ikke beregnet</p>
      <p class="meta">Disse partiers aktuelle program har ikke et tydeligt emnesignal for dette emne og indgår derfor ikke som 0% i fordelingen.</p>
      <div class="tag-row compact-tags">
        ${items
          .map(
            (item) =>
              `<span class="tag party-tag" style="${partyStyle(item.party_id)}">${renderPartySwatchById(
                item.party_id
              )}${escapeHtml(item.party_name)} · ${item.program_year}</span>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderMissingParties(ids = []) {
  if (!ids?.length) return "";
  return `<p class="meta">Ikke med i beregningen, fordi der ikke ligger aktuelle principprogrammer i datagrundlaget: ${ids
    .map((id) => escapeHtml(getGovernmentPartyName(id)))
    .join(", ")}.</p>`;
}

init().catch((error) => {
  const message = '<div class="empty">Kunne ikke indlæse datafilen.</div>';
  compareView.innerHTML = message;
  timelineView.innerHTML = message;
  partyView.innerHTML = message;
  if (governmentView) governmentView.innerHTML = message;
  if (searchView) searchView.innerHTML = message;
  compareSummary.textContent = "";
  timelineSummary.textContent = "";
  partySummary.textContent = "";
  if (governmentSummary) governmentSummary.textContent = "";
  if (searchSummary) searchSummary.textContent = "";
  console.error(error);
});
