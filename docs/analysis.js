const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";

const topicSelect = document.getElementById("analysis-topic-select");
const partySelect = document.getElementById("analysis-party-select");
const topicCards = document.getElementById("analysis-topic-cards");
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
};

async function init() {
  const [taxonomyResponse, suggestionsResponse] = await Promise.all([
    fetch(taxonomyUrl),
    fetch(suggestionsUrl),
  ]);

  if (!taxonomyResponse.ok || !suggestionsResponse.ok) {
    throw new Error("Kunne ikke hente analysefilerne.");
  }

  const taxonomy = await taxonomyResponse.json();
  const suggestions = await suggestionsResponse.json();

  state = {
    topics: taxonomy.topics,
    suggestions,
  };

  renderStatusStrip();
  renderTopicOptions();
  renderPartyOptions();
  renderTopicCards();

  topicSelect.addEventListener("change", renderAll);
  partySelect.addEventListener("change", renderAll);

  renderAll();
}

function renderStatusStrip() {
  const sourceCount = new Set(state.suggestions.map((item) => item.program_id)).size;
  statusTopics.textContent = String(state.topics.length);
  statusTexts.textContent = String(state.suggestions.length);
  statusPrograms.textContent = String(sourceCount);
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

function filterSuggestions() {
  const selectedTopic = topicSelect.value;
  const selectedParty = partySelect.value;

  return state.suggestions.filter((item) => {
    const topicMatch =
      selectedTopic === "all" ||
      item.primary_topic_id === selectedTopic ||
      item.secondary_topic_id === selectedTopic;
    const partyMatch = selectedParty === "all" || item.party_name === selectedParty;

    return topicMatch && partyMatch;
  });
}

function renderAll() {
  const items = filterSuggestions();
  const selectedTopic = topicSelect.value;
  const selectedParty = partySelect.value;

  const topicLabel = selectedTopic === "all" ? "Alle emner" : getTopicLabel(selectedTopic);
  const partyLabel = selectedParty === "all" ? "alle kilder" : selectedParty;

  filterTitle.textContent = topicLabel;
  filterSummary.textContent = `Viser ${items.length} tekststykker for ${partyLabel}.`;
  resultsSummary.textContent = `Viser ${items.length} tekstforslag. Primært emne vises først, sekundært emne vises som supplerende signal.`;

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
              <h3>${item.party_name} · ${item.year}</h3>
              <p class="meta">${item.title} · Tekst-id ${item.chunk_id}</p>
            </div>
            <div class="analysis-badges">
              <span class="tag">${item.primary_topic_label}</span>
              ${
                item.secondary_topic_label
                  ? `<span class="tag analysis-tag-alt">${item.secondary_topic_label}</span>`
                  : ""
              }
            </div>
          </div>
          <p class="context">${item.text}</p>
        </article>
      `
    )
    .join("");
}

init().catch((error) => {
  resultsView.innerHTML = '<div class="empty">Kunne ikke indlæse analysevisningen.</div>';
  console.error(error);
});
