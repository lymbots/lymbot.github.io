const dataUrl = "./data/programs.json";
const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";

const compareTopicSelect = document.getElementById("compare-topic-select");
const comparePartyCheckboxes = document.getElementById("compare-party-checkboxes");
const timelinePartySelect = document.getElementById("timeline-party-select");
const timelineTopicSelect = document.getElementById("timeline-topic-select");
const partyOverviewSelect = document.getElementById("party-overview-select");

const compareView = document.getElementById("compare-view");
const timelineView = document.getElementById("timeline-view");
const partyView = document.getElementById("party-view");
const compareSummary = document.getElementById("compare-summary");
const timelineSummary = document.getElementById("timeline-summary");
const partySummary = document.getElementById("party-summary");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const modePanels = Array.from(document.querySelectorAll(".mode-panel"));
const statusParties = document.getElementById("status-parties");
const statusPrograms = document.getElementById("status-programs");
const statusTopics = document.getElementById("status-topics");

let state = {
  topics: [],
  parties: [],
  programs: [],
  suggestions: [],
};

async function init() {
  const [dataResponse, taxonomyResponse, suggestionsResponse] = await Promise.all([
    fetch(dataUrl),
    fetch(taxonomyUrl),
    fetch(suggestionsUrl),
  ]);

  if (!dataResponse.ok || !taxonomyResponse.ok || !suggestionsResponse.ok) {
    throw new Error("Kunne ikke hente alle datafiler.");
  }

  const data = await dataResponse.json();
  const taxonomy = await taxonomyResponse.json();
  const suggestions = await suggestionsResponse.json();

  state = {
    ...data,
    topics: taxonomy.topics,
    suggestions,
  };
  renderStatusStrip();

  renderTopicOptions(compareTopicSelect);
  renderTopicOptions(timelineTopicSelect);
  renderPartyCheckboxes();
  renderPartyOptions(timelinePartySelect);
  renderPartyOptions(partyOverviewSelect);

  compareTopicSelect.addEventListener("change", renderAll);
  timelinePartySelect.addEventListener("change", renderAll);
  timelineTopicSelect.addEventListener("change", renderAll);
  partyOverviewSelect.addEventListener("change", renderAll);
  comparePartyCheckboxes.addEventListener("change", renderAll);

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  renderAll();
}

function renderStatusStrip() {
  if (statusParties) statusParties.textContent = String(state.parties.length);
  if (statusPrograms) statusPrograms.textContent = String(state.programs.length);
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

function renderPartyCheckboxes() {
  comparePartyCheckboxes.innerHTML = state.parties
    .map(
      (party, index) => `
      <label>
        <input type="checkbox" value="${escapeHtml(party.id)}" ${index < 3 ? "checked" : ""} />
        <span>${escapeHtml(party.name)}</span>
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

function getTopicLabel(topicId) {
  return state.topics.find((topic) => topic.id === topicId)?.label ?? topicId;
}

function getPartyName(partyId) {
  return state.parties.find((party) => party.id === partyId)?.name ?? partyId;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getProgramTopicSuggestions(programId, topicId) {
  return state.suggestions
    .filter(
      (item) =>
        item.program_id === programId &&
        (item.primary_topic_id === topicId || item.secondary_topic_id === topicId)
    )
    .sort((a, b) => {
      if (a.primary_topic_id === topicId && b.primary_topic_id !== topicId) return -1;
      if (a.primary_topic_id !== topicId && b.primary_topic_id === topicId) return 1;
      return a.chunk_id.localeCompare(b.chunk_id, "da");
    });
}

function getTopicLabelsForProgram(program) {
  const topicIds = new Set(
    state.suggestions
      .filter((item) => item.program_id === program.id)
      .map((item) => item.primary_topic_id)
  );

  return Array.from(topicIds)
    .map((topicId) => getTopicLabel(topicId))
    .sort((a, b) => a.localeCompare(b, "da"));
}

function renderSourceLink(program) {
  if (!program.externalUrl) return "";
  return `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`;
}

function renderFullTextLink(program) {
  return `<p class="meta"><a href="./program.html?program=${encodeURIComponent(
    program.id
  )}">Åbn kildeside for program</a></p>`;
}

function renderContext(program) {
  if (!program.context) return "";
  return `<p class="context">${escapeHtml(program.context)}</p>`;
}

function renderExcerpts(suggestions, limit = 2) {
  return suggestions
    .slice(0, limit)
    .map((suggestion) => {
      const sourceLabel =
        suggestion.primary_topic_id === suggestion.secondary_topic_id || !suggestion.secondary_topic_id
          ? "Primært emneforslag"
          : suggestion.primary_topic_label;

      return `
        <div class="excerpt-block">
          <p class="excerpt">${escapeHtml(suggestion.text)}</p>
          <p class="meta">${escapeHtml(sourceLabel)} · ${escapeHtml(suggestion.chunk_id)}</p>
        </div>
      `;
    })
    .join("");
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
  renderCompare(compareTopicSelect.value, getSelectedPartyIds());
  renderTimeline(timelineTopicSelect.value, timelinePartySelect.value);
  renderPartyOverview(partyOverviewSelect.value);
}

function renderCompare(topicId, partyIds) {
  compareView.innerHTML = "";

  if (!topicId) {
    compareView.innerHTML = '<div class="empty">Vælg et emne for at starte.</div>';
    compareSummary.textContent = "";
    return;
  }

  if (partyIds.length === 0) {
    compareView.innerHTML = '<div class="empty">Vælg mindst ét parti for sammenligning.</div>';
    compareSummary.textContent = "";
    return;
  }

  const cards = partyIds
    .map((partyId) => {
      const programs = state.programs
        .filter((program) => program.partyId === partyId)
        .map((program) => ({
          ...program,
          topicSuggestions: getProgramTopicSuggestions(program.id, topicId),
        }))
        .filter((program) => program.topicSuggestions.length > 0)
        .sort((a, b) => a.year - b.year);

      if (programs.length === 0) {
        return `
        <article class="party-card">
          <h3>${escapeHtml(getPartyName(partyId))}</h3>
          <p class="empty">Ingen emneforslag endnu for emnet ${escapeHtml(getTopicLabel(topicId))}.</p>
        </article>
      `;
      }

      const programBlocks = programs
        .map((program) => `
          <section class="program-block">
            <p class="meta"><strong>${program.year}</strong> · ${escapeHtml(program.title)}</p>
            ${renderContext(program)}
            ${renderExcerpts(program.topicSuggestions, 2)}
            <p class="meta">Kilde: ${escapeHtml(program.sourceFile)}</p>
            ${renderSourceLink(program)}
            ${renderFullTextLink(program)}
          </section>
        `)
        .join("");

      return `
      <article class="party-card">
        <h3>${escapeHtml(getPartyName(partyId))}</h3>
        ${programBlocks}
      </article>
    `;
    })
    .join("");

  compareSummary.textContent = `Emne: ${getTopicLabel(topicId)}. Viser ${partyIds.length} parti(er) med analysebaserede uddrag.`;
  compareView.innerHTML = cards;
}

function renderTimeline(topicId, partyId) {
  timelineView.innerHTML = "";

  if (!topicId || !partyId) {
    timelineView.innerHTML = '<div class="empty">Vælg emne og parti for tidsvisning.</div>';
    timelineSummary.textContent = "";
    return;
  }

  const programs = state.programs
    .filter((program) => program.partyId === partyId)
    .map((program) => ({
      ...program,
      topicSuggestions: getProgramTopicSuggestions(program.id, topicId),
    }))
    .filter((program) => program.topicSuggestions.length > 0)
    .sort((a, b) => a.year - b.year);

  timelineSummary.textContent = `Parti: ${getPartyName(partyId)} · Emne: ${getTopicLabel(topicId)}`;

  if (programs.length === 0) {
    timelineView.innerHTML = '<div class="empty">Ingen emneforslag for valgt emne/parti endnu.</div>';
    return;
  }

  timelineView.innerHTML = programs
    .map((program) => `
      <article class="timeline-item">
        <div class="timeline-marker" aria-hidden="true"></div>
        <div class="timeline-content">
          <h3>${program.year} · ${escapeHtml(program.title)}</h3>
          ${renderContext(program)}
          ${renderExcerpts(program.topicSuggestions, 3)}
          <p class="meta">Kilde: ${escapeHtml(program.sourceFile)}</p>
          ${renderSourceLink(program)}
            ${renderFullTextLink(program)}
        </div>
      </article>
    `)
    .join("");
}

function renderPartyOverview(partyId) {
  partyView.innerHTML = "";

  if (!partyId) {
    partyView.innerHTML = '<div class="empty">Vælg et parti for at se oversigten.</div>';
    partySummary.textContent = "";
    return;
  }

  const programs = state.programs
    .filter((program) => program.partyId === partyId)
    .sort((a, b) => a.year - b.year);

  partySummary.textContent = `${getPartyName(partyId)} · ${programs.length} program(mer) er lagt ind i denne version.`;

  if (programs.length === 0) {
    partyView.innerHTML = '<div class="empty">Ingen programmer lagt ind for dette parti endnu.</div>';
    return;
  }

  const timelineNav = `
    <div class="mini-timeline" aria-label="Programmer i tid">
      ${programs
        .map(
          (program) => `
          <div class="mini-timeline-item">
            <span class="mini-year">${program.year}</span>
            <span class="mini-title">${escapeHtml(program.title)}</span>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  const cards = programs
    .map(
      (program) => `
      <article class="overview-card">
        <div class="overview-head">
          <h3>${program.year} · ${escapeHtml(program.title)}</h3>
        </div>
        ${renderContext(program)}
        ${renderTopicTags(program)}
        <p class="meta">Kilde: ${escapeHtml(program.sourceFile)}</p>
        ${renderSourceLink(program)}
            ${renderFullTextLink(program)}
      </article>
    `
    )
    .join("");

  partyView.innerHTML = `${timelineNav}<div class="overview-grid">${cards}</div>`;
}

init().catch((error) => {
  const message = '<div class="empty">Kunne ikke indlæse datafilen.</div>';
  compareView.innerHTML = message;
  timelineView.innerHTML = message;
  partyView.innerHTML = message;
  compareSummary.textContent = "";
  timelineSummary.textContent = "";
  partySummary.textContent = "";
  console.error(error);
});
