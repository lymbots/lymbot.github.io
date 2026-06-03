const dataUrl = "./data/programs.json";
const governmentsUrl = "./data/governments.json";
const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";
const similarityUrl = "./data/analysis/government_similarity.json";

const compareTopicSelect = document.getElementById("compare-topic-select");
const comparePartyCheckboxes = document.getElementById("compare-party-checkboxes");
const compareGovernmentCheckboxes = document.getElementById("compare-government-checkboxes");
const timelinePartySelect = document.getElementById("timeline-party-select");
const timelineTopicSelect = document.getElementById("timeline-topic-select");
const partyOverviewSelect = document.getElementById("party-overview-select");
const governmentSelect = document.getElementById("government-select");
const governmentTopicSelect = document.getElementById("government-topic-select");

const compareView = document.getElementById("compare-view");
const timelineView = document.getElementById("timeline-view");
const partyView = document.getElementById("party-view");
const governmentView = document.getElementById("government-view");
const compareSummary = document.getElementById("compare-summary");
const timelineSummary = document.getElementById("timeline-summary");
const partySummary = document.getElementById("party-summary");
const governmentSummary = document.getElementById("government-summary");
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
};

async function init() {
  const [dataResponse, governmentsResponse, taxonomyResponse, suggestionsResponse, similarityResponse] =
    await Promise.all([
      fetch(dataUrl),
      fetch(governmentsUrl),
      fetch(taxonomyUrl),
      fetch(suggestionsUrl),
      fetch(similarityUrl),
    ]);

  if (
    !dataResponse.ok ||
    !governmentsResponse.ok ||
    !taxonomyResponse.ok ||
    !suggestionsResponse.ok ||
    !similarityResponse.ok
  ) {
    throw new Error("Kunne ikke hente alle datafiler.");
  }

  const data = await dataResponse.json();
  const governmentsData = await governmentsResponse.json();
  const taxonomy = await taxonomyResponse.json();
  const suggestions = await suggestionsResponse.json();
  const similarities = await similarityResponse.json();

  state = {
    ...data,
    topics: taxonomy.topics,
    governments: governmentsData.governments,
    governmentParties: governmentsData.parties,
    suggestions,
    similarities,
  };

  renderStatusStrip();
  renderTopicOptions(compareTopicSelect);
  renderTopicOptions(timelineTopicSelect);
  renderTopicOptions(governmentTopicSelect);
  renderPartyCheckboxes();
  renderGovernmentCheckboxes();
  renderPartyOptions(timelinePartySelect);
  renderPartyOptions(partyOverviewSelect);
  renderGovernmentOptions(governmentSelect);

  compareTopicSelect.addEventListener("change", renderAll);
  timelinePartySelect.addEventListener("change", renderAll);
  timelineTopicSelect.addEventListener("change", renderAll);
  partyOverviewSelect.addEventListener("change", renderAll);
  governmentSelect.addEventListener("change", renderAll);
  governmentTopicSelect.addEventListener("change", renderAll);
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

function getPartyName(partyId) {
  return state.parties.find((party) => party.id === partyId)?.name ?? getGovernmentPartyName(partyId);
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

function getProgramStatusLabel(program) {
  return getProgramStatus(program) === "current" ? "Aktuelt program" : "Historisk program";
}

function renderProgramStatus(program) {
  const status = getProgramStatus(program);
  return `<span class="program-status program-status-${status}">${getProgramStatusLabel(program)}</span>`;
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
    .filter((item) => item.program_id === programId && item.primary_topic_id === topicId)
    .sort((a, b) => a.chunk_id.localeCompare(b.chunk_id, "da"));
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
  return `<p class="meta"><a href="${getProgramUrl(program)}">Åbn fuld programtekst</a></p>`;
}

function renderGovernmentFullTextLink(government) {
  return `<p class="meta"><a href="${getGovernmentUrl(government)}">Åbn fuld dokumenttekst</a></p>`;
}

function renderContext(program) {
  if (!program.context) return "";
  return `<p class="context">${escapeHtml(program.context)}</p>`;
}

function renderPartyTags(ids, emptyText = "Ikke særskilt registreret") {
  if (!ids || ids.length === 0) return `<span class="tag analysis-tag-alt">${escapeHtml(emptyText)}</span>`;
  return ids.map((id) => `<span class="tag">${escapeHtml(getGovernmentPartyName(id))}</span>`).join("");
}

function renderExcerpts(suggestions, topicId, limit = 2) {
  const topicLabel = getTopicLabel(topicId);

  return suggestions
    .slice(0, limit)
    .map(
      (suggestion) => `
        <div class="excerpt-block">
          <p class="excerpt">${escapeHtml(suggestion.text)}</p>
          <p class="meta">${escapeHtml(topicLabel)} · Tekst-id ${escapeHtml(suggestion.chunk_id)}</p>
        </div>
      `
    )
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
  renderCompare(compareTopicSelect.value, getSelectedPartyIds(), getSelectedGovernmentIds());
  renderTimeline(timelineTopicSelect.value, timelinePartySelect.value);
  renderPartyOverview(partyOverviewSelect.value);
  renderGovernmentOverview(governmentSelect.value, governmentTopicSelect.value);
}

function renderCompare(topicId, partyIds, governmentIds) {
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

  const partyCards = partyIds.map((partyId) => renderPartyCompareCard(partyId, topicId)).join("");
  const governmentCards = governmentIds.map((governmentId) => renderGovernmentCompareCard(governmentId, topicId)).join("");

  compareSummary.textContent = `Emne: ${getTopicLabel(topicId)}. Viser ${partyIds.length} partier og ${governmentIds.length} regeringsgrundlag med foreløbige analyseuddrag.`;
  compareView.innerHTML = partyCards + governmentCards;
}

function renderPartyCompareCard(partyId, topicId) {
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
    .map(
      (program) => `
        <section class="program-block">
          <p class="meta"><strong>${program.year}</strong> · ${escapeHtml(program.title)} ${renderProgramStatus(
        program
      )}</p>
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
    <article class="party-card">
      <p class="section-kicker">Parti</p>
      <h3>${escapeHtml(getPartyName(partyId))}</h3>
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
      ${suggestions.length ? renderExcerpts(suggestions, topicId, 3) : '<p class="empty">Ingen emneforslag endnu for dette emne. Hvis PDF’en er scannet, kræver den OCR før analyse.</p>'}
      ${renderGovernmentFullTextLink(government)}
      ${renderPdfLink(government)}
      ${renderMetadataLink(government)}
    </article>
  `;
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
    .map(
      (program) => `
      <article class="timeline-item">
        <div class="timeline-marker" aria-hidden="true"></div>
        <div class="timeline-content">
          <h3>${program.year} · ${escapeHtml(program.title)} ${renderProgramStatus(program)}</h3>
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

  const programLabel = programs.length === 1 ? "program" : "programmer";
  partySummary.textContent = `${getPartyName(partyId)} · ${programs.length} ${programLabel} er lagt ind i denne version.`;

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
      <article class="overview-card">
        <div class="overview-head">
          <h3>${program.year} · ${escapeHtml(program.title)} ${renderProgramStatus(program)}</h3>
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

  partyView.innerHTML = `
    ${timelineNav}
    <div class="program-detail-section">
      <div class="program-detail-head">
        <p class="section-kicker">Programmer og emneforslag</p>
        <h3>Programkort</h3>
        <p class="meta">Her vises hvert programs kontekst, kilde og de emner, som analysen har fundet.</p>
      </div>
      <div class="overview-grid">${cards}</div>
    </div>
  `;
}

function renderGovernmentOverview(governmentId, topicId) {
  if (!governmentView) return;
  const government = state.governments.find((item) => item.id === governmentId) ?? state.governments[0];
  if (!government) {
    governmentView.innerHTML = '<div class="empty">Ingen regeringsgrundlag er lagt ind endnu.</div>';
    governmentSummary.textContent = "";
    return;
  }

  const suggestions = getProgramTopicSuggestions(government.id, topicId);
  const topicLabel = getTopicLabel(topicId);
  governmentSummary.textContent = `${government.year} · ${government.title} · ${topicLabel}`;

  const archiveCards = [...state.governments]
    .sort((a, b) => b.year - a.year)
    .map(
      (item) => `
        <article class="overview-card">
          <h3>${item.year} · ${escapeHtml(item.title)} ${renderGovernmentStatus(item)}</h3>
          <p class="meta">${escapeHtml(item.typeLabel)} · ${escapeHtml(item.governmentName)}</p>
          ${renderGovernmentMeta(item)}
          ${item.note ? `<p class="context">${escapeHtml(item.note)}</p>` : ""}
          ${renderGovernmentFullTextLink(item)}
          ${renderPdfLink(item)}
        </article>
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
        <p class="meta">Uddragene viser tekststykker, hvor regeringsgrundlaget primært matcher dette emne.</p>
      </div>
      ${suggestions.length ? renderExcerpts(suggestions, topicId, 5) : '<div class="empty">Ingen emneforslag for dette emne i dokumentet. Scannede PDF’er kræver OCR før de kan analyseres.</div>'}
    </section>

    <section class="program-detail-section">
      <div class="program-detail-head">
        <p class="section-kicker">Tekstlig nærhed</p>
        <h3>Partispor i emnet</h3>
        <p class="meta">Indikatoren sammenligner regeringsgrundlagets emnetekst med aktuelle principprogrammer for partier i regering og parlamentarisk grundlag. Den viser tekstlig nærhed, ikke dokumenteret kausal indflydelse.</p>
      </div>
      ${renderSimilarityBars(government.id, topicId)}
    </section>

    <section class="program-detail-section">
      <div class="program-detail-head">
        <p class="section-kicker">Arkiv</p>
        <h3>Alle regeringsgrundlag</h3>
      </div>
      <div class="overview-grid">${archiveCards}</div>
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
  if (!row || row.scores.length === 0) {
    return `<div class="empty">${escapeHtml(row?.note || "Ingen beregning for dette udsnit endnu.")}</div>`;
  }

  return `
    <div class="similarity-list">
      ${row.scores
        .map((score) => {
          const width = Math.round(score.share * 100);
          const pct = `${width}%`;
          return `
            <div class="similarity-row">
              <div class="similarity-row-head">
                <span><strong>${escapeHtml(score.party_name)}</strong> · ${escapeHtml(score.role)}</span>
                <span>${pct}</span>
              </div>
              <div class="similarity-bar" aria-label="${escapeHtml(score.party_name)} ${pct}">
                <span style="width: ${pct}"></span>
              </div>
              <p class="meta">Sammenlignet med ${score.program_year} · ${escapeHtml(score.program_title)}${
            score.has_topic_text ? "" : " · ingen emnetekst fundet i programmet"
          }</p>
            </div>
          `;
        })
        .join("")}
      ${
        row.missing_party_ids?.length
          ? `<p class="meta">Ikke med i beregningen, fordi der ikke ligger aktuelle principprogrammer i datagrundlaget: ${row.missing_party_ids
              .map((id) => escapeHtml(getGovernmentPartyName(id)))
              .join(", ")}.</p>`
          : ""
      }
    </div>
  `;
}

init().catch((error) => {
  const message = '<div class="empty">Kunne ikke indlæse datafilen.</div>';
  compareView.innerHTML = message;
  timelineView.innerHTML = message;
  partyView.innerHTML = message;
  if (governmentView) governmentView.innerHTML = message;
  compareSummary.textContent = "";
  timelineSummary.textContent = "";
  partySummary.textContent = "";
  if (governmentSummary) governmentSummary.textContent = "";
  console.error(error);
});
