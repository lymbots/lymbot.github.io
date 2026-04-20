const dataUrl = "./data/programs.json";

const topicSelect = document.getElementById("topic-select");
const partyCheckboxes = document.getElementById("party-checkboxes");
const timelinePartySelect = document.getElementById("timeline-party-select");
const compareView = document.getElementById("compare-view");
const timelineView = document.getElementById("timeline-view");
const compareSummary = document.getElementById("compare-summary");
const timelineSummary = document.getElementById("timeline-summary");

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

  renderTopicOptions();
  renderPartyCheckboxes();
  renderTimelinePartyOptions();

  topicSelect.addEventListener("change", renderAll);
  timelinePartySelect.addEventListener("change", renderAll);
  partyCheckboxes.addEventListener("change", renderAll);

  renderAll();
}

function renderTopicOptions() {
  topicSelect.innerHTML = state.topics
    .map((topic, index) => {
      const selected = index === 0 ? "selected" : "";
      return `<option value="${topic.id}" ${selected}>${topic.label}</option>`;
    })
    .join("");
}

function renderPartyCheckboxes() {
  partyCheckboxes.innerHTML = state.parties
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

function renderTimelinePartyOptions() {
  timelinePartySelect.innerHTML = state.parties
    .map((party, index) => {
      const selected = index === 0 ? "selected" : "";
      return `<option value="${party.id}" ${selected}>${party.name}</option>`;
    })
    .join("");
}

function getSelectedPartyIds() {
  return Array.from(partyCheckboxes.querySelectorAll("input:checked")).map(
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

function renderSourceLink(program) {
  if (!program.externalUrl) return "";
  return `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`;
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

function renderAll() {
  const selectedTopic = topicSelect.value;
  const selectedPartyIds = getSelectedPartyIds();
  const selectedTimelineParty = timelinePartySelect.value;

  renderCompare(selectedTopic, selectedPartyIds);
  renderTimeline(selectedTopic, selectedTimelineParty);
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
        <h3>${program.year} · ${program.title}</h3>
        ${renderContext(program)}
        ${renderExcerpts(program.topicEntry)}
        <p class="meta">Kilde: ${program.sourceFile}</p>
        ${renderSourceLink(program)}
      </article>
    `)
    .join("");
}

init().catch((error) => {
  compareView.innerHTML = '<div class="empty">Kunne ikke indlæse datafilen.</div>';
  timelineView.innerHTML = '<div class="empty">Kunne ikke indlæse datafilen.</div>';
  compareSummary.textContent = "";
  timelineSummary.textContent = "";
  console.error(error);
});
