const dataUrl = "./data/programs.json";

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

let state = {
  topics: [],
  parties: [],
  programs: [],
};

async function init() {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Kunne ikke hente datafilen: ${response.status}`);
  }

  state = await response.json();

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
      return `<option value="${topic.id}" ${selected}>${topic.label}</option>`;
    })
    .join("");
}

function renderPartyOptions(selectElement) {
  selectElement.innerHTML = state.parties
    .map((party, index) => {
      const selected = index === 0 ? "selected" : "";
      return `<option value="${party.id}" ${selected}>${party.name}</option>`;
    })
    .join("");
}

function renderPartyCheckboxes() {
  comparePartyCheckboxes.innerHTML = state.parties
    .map(
      (party, index) => `
      <label>
        <input type="checkbox" value="${party.id}" ${index < 3 ? "checked" : ""} />
        <span>${party.name}</span>
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

function topicEntriesForProgram(program, topicId) {
  return program.topics.find((topic) => topic.topicId === topicId);
}

function getTopicLabelsForProgram(program) {
  return program.topics
    .map((topic) => getTopicLabel(topic.topicId))
    .sort((a, b) => a.localeCompare(b, "da"));
}

function renderSourceLink(program) {
  if (!program.externalUrl) return "";
  return `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`;
}

function renderFullTextLink(program) {
  if (!program.fullTextPath) return "";
  return `<p class="meta"><a href="${program.fullTextPath}" target="_blank" rel="noreferrer">Åbn fuld programtekst</a></p>`;
}

function renderContext(program) {
  if (!program.context) return "";
  return `<p class="context">${program.context}</p>`;
}

function renderExcerpts(topicEntry) {
  return topicEntry.excerpts
    .map((excerpt) => `<p class="excerpt">${excerpt.text}</p>`)
    .join("");
}

function renderTopicTags(program) {
  const labels = getTopicLabelsForProgram(program);
  if (labels.length === 0) return '<p class="meta">Ingen kuraterede emner endnu.</p>';

  return `
    <div class="tag-row">
      ${labels.map((label) => `<span class="tag">${label}</span>`).join("")}
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
          topicEntry: topicEntriesForProgram(program, topicId),
        }))
        .filter((program) => program.topicEntry && program.topicEntry.excerpts.length > 0)
        .sort((a, b) => a.year - b.year);

      if (programs.length === 0) {
        return `
        <article class="party-card">
          <h3>${getPartyName(partyId)}</h3>
          <p class="empty">Ingen kuraterede uddrag endnu for emnet ${getTopicLabel(topicId)}.</p>
        </article>
      `;
      }

      const programBlocks = programs
        .map((program) => `
          <section class="program-block">
            <p class="meta"><strong>${program.year}</strong> · ${program.title}</p>
            ${renderContext(program)}
            ${renderExcerpts(program.topicEntry)}
            <p class="meta">Kilde: ${program.sourceFile}</p>
            ${renderSourceLink(program)}
            ${renderFullTextLink(program)}
          </section>
        `)
        .join("");

      return `
      <article class="party-card">
        <h3>${getPartyName(partyId)}</h3>
        ${programBlocks}
      </article>
    `;
    })
    .join("");

  compareSummary.textContent = `Emne: ${getTopicLabel(topicId)}. Viser ${partyIds.length} parti(er).`;
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
      topicEntry: topicEntriesForProgram(program, topicId),
    }))
    .filter((program) => program.topicEntry && program.topicEntry.excerpts.length > 0)
    .sort((a, b) => a.year - b.year);

  timelineSummary.textContent = `Parti: ${getPartyName(partyId)} · Emne: ${getTopicLabel(topicId)}`;

  if (programs.length === 0) {
    timelineView.innerHTML = '<div class="empty">Ingen kuraterede uddrag for valgt emne/parti endnu.</div>';
    return;
  }

  timelineView.innerHTML = programs
    .map((program) => `
      <article class="timeline-item">
        <div class="timeline-marker" aria-hidden="true"></div>
        <div class="timeline-content">
          <h3>${program.year} · ${program.title}</h3>
          ${renderContext(program)}
          ${renderExcerpts(program.topicEntry)}
          <p class="meta">Kilde: ${program.sourceFile}</p>
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
            <span class="mini-title">${program.title}</span>
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
          <h3>${program.year} · ${program.title}</h3>
        </div>
        ${renderContext(program)}
        ${renderTopicTags(program)}
        <p class="meta">Kilde: ${program.sourceFile}</p>
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
