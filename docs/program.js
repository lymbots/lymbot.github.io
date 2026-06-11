const dataVersion = "2026-06-11-topic-signals-v1";
const dataUrl = "./data/programs.json";
const governmentsUrl = "./data/governments.json";
const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";
const root = document.getElementById("program-source-root");

function getSourceParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    programId: params.get("program"),
    governmentId: params.get("government"),
  };
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

function getLatestProgramYear(programs, partyId) {
  const years = programs
    .filter((program) => program.partyId === partyId)
    .map((program) => Number(program.year));

  return years.length ? Math.max(...years) : 0;
}

function getProgramStatus(program, programs) {
  return Number(program.year) === getLatestProgramYear(programs, program.partyId)
    ? "current"
    : "historical";
}

function getProgramStatusLabel(program, programs) {
  return getProgramStatus(program, programs) === "current" ? "Aktuelt program" : "Historisk program";
}

function renderProgramStatus(program, programs) {
  const status = getProgramStatus(program, programs);
  return `<span class="program-status program-status-${status}">${getProgramStatusLabel(
    program,
    programs
  )}</span>`;
}

function renderProgramType(program) {
  if (!program.programTypeLabel) return "";
  return `<p class="meta"><strong>Dokumenttype:</strong> ${escapeHtml(program.programTypeLabel)}</p>`;
}

function getPartyMeta(parties, partyId) {
  return parties.find((party) => party.id === partyId) ?? {
    id: partyId,
    name: partyId,
    color: "#14583f",
    colorSoft: "#e0f0e9",
    shortName: partyId,
  };
}

function partyStyle(parties, partyId) {
  const meta = getPartyMeta(parties, partyId);
  return `--party-color: ${escapeHtml(meta.color || "#14583f")}; --party-soft: ${escapeHtml(
    meta.colorSoft || "#e0f0e9"
  )};`;
}

function renderPartySwatch(parties, partyId) {
  const meta = getPartyMeta(parties, partyId);
  return `<span class="party-swatch" style="${partyStyle(parties, partyId)}" aria-hidden="true">${escapeHtml(
    meta.shortName || partyId
  )}</span>`;
}

function getGovernmentStatus(government, governments) {
  const latestYear = Math.max(...governments.map((item) => Number(item.year)));
  return Number(government.year) === latestYear ? "current" : "historical";
}

function renderGovernmentStatus(government, governments) {
  const status = getGovernmentStatus(government, governments);
  const label = status === "current" ? "Aktuelt regeringsgrundlag" : "Historisk regeringsgrundlag";
  return `<span class="program-status program-status-${status}">${label}</span>`;
}

function getTopicMatchInfo(item, topicId) {
  if (item.primary_topic_id === topicId) return { label: "Primært emne", order: 1 };
  if (item.secondary_topic_id === topicId) return { label: "Sekundært emnesignal", order: 2 };
  const signal = (item.topic_signals || []).find((entry) => entry.topic_id === topicId);
  if (signal) return { label: "Bredt emnesignal", order: 3 };
  return null;
}

function renderTopicBlocks(sourceId, topics, suggestions) {
  const sourceSuggestions = suggestions.filter((item) => item.program_id === sourceId);

  if (sourceSuggestions.length === 0) {
    return '<p class="meta">Ingen emneforslag endnu.</p>';
  }

  const grouped = topics
    .map((topic) => ({
      ...topic,
      suggestions: sourceSuggestions
        .filter((item) => getTopicMatchInfo(item, topic.id))
        .sort((a, b) => {
          const matchA = getTopicMatchInfo(a, topic.id);
          const matchB = getTopicMatchInfo(b, topic.id);
          return (matchA.order - matchB.order) || a.chunk_id.localeCompare(b.chunk_id, "da");
        }),
    }))
    .filter((topic) => topic.suggestions.length > 0);

  return grouped
    .map((topicEntry) => {
      const excerpts = topicEntry.suggestions
        .slice(0, 4)
        .map((suggestion) => {
          const match = getTopicMatchInfo(suggestion, topicEntry.id);
          return `
            <div class="excerpt-block">
              <p class="excerpt">${escapeHtml(suggestion.text)}</p>
              <p class="meta">Tekst-id ${escapeHtml(suggestion.chunk_id)} · Match: ${escapeHtml(
            match?.label || "Emnematch"
          )} · Primært: ${escapeHtml(
            suggestion.primary_topic_label
          )}${
            suggestion.secondary_topic_label
              ? ` · Sekundært: ${escapeHtml(suggestion.secondary_topic_label)}`
              : ""
          }</p>
            </div>
          `;
        })
        .join("");

      return `
        <section class="source-topic">
          <h3>${escapeHtml(topicEntry.label)}</h3>
          <p class="meta">${topicEntry.suggestions.length} tekststykker matcher dette emne.</p>
          ${excerpts}
        </section>
      `;
    })
    .join("");
}

function splitIntoParagraphs(rawText) {
  const normalizedText = rawText
    .replace(/(\p{L})-\r?\n(\p{L})/gu, "$1$2")
    .replace(/\f/g, "\n\n");

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const paragraphs = [];
  let current = "";

  for (const line of lines) {
    const looksLikeHeading = line.length <= 60 && /^[A-ZÆØÅ0-9'".,:!?() \-]+$/.test(line);

    if (looksLikeHeading) {
      if (current) {
        paragraphs.push(current.trim());
        current = "";
      }
      paragraphs.push(`__heading__${line}`);
      continue;
    }

    const previousEndsSentence = current.length > 0 && /[.!?]$/.test(current);
    const startsWithUpper = /^[A-ZÆØÅ]/.test(line);
    const shouldBreak = previousEndsSentence && startsWithUpper && current.length > 240;

    if (shouldBreak) {
      paragraphs.push(current.trim());
      current = line;
    } else {
      current = current ? `${current} ${line}` : line;
    }
  }

  if (current) {
    paragraphs.push(current.trim());
  }

  return paragraphs;
}

function renderFullText(rawText) {
  const paragraphs = splitIntoParagraphs(rawText);
  return paragraphs
    .map((paragraph) => {
      if (paragraph.startsWith("__heading__")) {
        return `<h3 class="source-heading">${escapeHtml(paragraph.replace("__heading__", ""))}</h3>`;
      }
      return `<p>${escapeHtml(paragraph)}</p>`;
    })
    .join("");
}

function renderPartyTags(ids, parties, emptyText = "Ikke særskilt registreret") {
  if (!ids || ids.length === 0) return `<span class="tag analysis-tag-alt">${escapeHtml(emptyText)}</span>`;
  return ids
    .map((id) => {
      const name = parties.find((party) => party.id === id)?.name ?? id;
      return `<span class="tag party-tag" style="${partyStyle(parties, id)}">${renderPartySwatch(
        parties,
        id
      )}${escapeHtml(name)}</span>`;
    })
    .join("");
}

function renderGovernmentMeta(government, parties) {
  return `
    <p class="meta"><strong>Statsminister:</strong> ${escapeHtml(government.primeMinister || "Ukendt")}</p>
    <p class="meta"><strong>Periode:</strong> ${escapeHtml(government.period || "Ukendt")}</p>
    <p class="meta"><strong>Regering:</strong></p>
    <div class="tag-row compact-tags">${renderPartyTags(government.governmentParties, parties)}</div>
    <p class="meta"><strong>Parlamentarisk grundlag:</strong></p>
    <div class="tag-row compact-tags">${renderPartyTags(government.parliamentaryBasis, parties)}</div>
  `;
}

async function fetchFullText(path) {
  if (!path) return "";
  const response = await fetch(withVersion(path));
  return response.ok ? response.text() : "";
}

function withVersion(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${dataVersion}`;
}

async function init() {
  const { programId, governmentId } = getSourceParams();
  if (!programId && !governmentId) {
    root.innerHTML = '<div class="empty">Mangler kilde-id i URL.</div>';
    return;
  }

  const [dataResponse, governmentsResponse, taxonomyResponse, suggestionsResponse] = await Promise.all([
    fetch(withVersion(dataUrl)),
    fetch(withVersion(governmentsUrl)),
    fetch(withVersion(taxonomyUrl)),
    fetch(withVersion(suggestionsUrl)),
  ]);

  if (!dataResponse.ok || !governmentsResponse.ok || !taxonomyResponse.ok || !suggestionsResponse.ok) {
    throw new Error("Kunne ikke hente alle datafiler.");
  }

  const data = await dataResponse.json();
  const governmentsData = await governmentsResponse.json();
  const taxonomy = await taxonomyResponse.json();
  const suggestions = await suggestionsResponse.json();

  if (governmentId) {
    await renderGovernmentSource(governmentId, governmentsData, taxonomy, suggestions);
    return;
  }

  await renderProgramSource(programId, data, taxonomy, suggestions);
}

async function renderProgramSource(programId, data, taxonomy, suggestions) {
  const program = data.programs.find((item) => item.id === programId);
  if (!program) {
    root.innerHTML = '<div class="empty">Programmet blev ikke fundet.</div>';
    return;
  }

  const fullText = await fetchFullText(program.fullTextPath);
  const partyName = data.parties.find((party) => party.id === program.partyId)?.name ?? program.partyId;

  root.innerHTML = `
    <header class="source-header source-header-party" style="${partyStyle(data.parties, program.partyId)}">
      <p class="section-kicker">Programtekst</p>
      <h1>${escapeHtml(program.title)}</h1>
      <p class="lead">${renderPartySwatch(data.parties, program.partyId)}${escapeHtml(partyName)} · ${program.year} ${renderProgramStatus(program, data.programs)}</p>
      ${renderProgramType(program)}
      <p class="context">${escapeHtml(program.context || "")}</p>
      <p class="meta">Kildefil: ${escapeHtml(program.sourceFile || "Ukendt kildefil")}</p>
      ${
        program.externalUrl
          ? `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`
          : ""
      }
    </header>

    <nav class="source-jump-nav" aria-label="Kildesektioner">
      <a href="#full-text">Fuld tekst</a>
      <a href="#topic-suggestions">Emneforslag</a>
    </nav>

    <section id="full-text" class="source-section">
      <h2>Fuld programtekst</h2>
      ${
        fullText
          ? `<article class="source-text">${renderFullText(fullText)}</article>`
          : '<div class="empty">Fuldtekst er endnu ikke tilgængelig for dette program.</div>'
      }
    </section>

    <section id="topic-suggestions" class="source-section">
      <h2>Emneforslag fra analysen</h2>
      <p class="meta">Emnerne er automatiske læseindgange. Primært emne styrer navigationen; sekundære og brede emnesignaler viser relevant indhold i bredere programafsnit.</p>
      ${renderTopicBlocks(program.id, taxonomy.topics, suggestions)}
    </section>
  `;

  document.title = `${program.title} · Programkilde`;
}

async function renderGovernmentSource(governmentId, governmentsData, taxonomy, suggestions) {
  const government = governmentsData.governments.find((item) => item.id === governmentId);
  if (!government) {
    root.innerHTML = '<div class="empty">Regeringsgrundlaget blev ikke fundet.</div>';
    return;
  }

  const fullText = await fetchFullText(government.fullTextPath);

  root.innerHTML = `
    <header class="source-header">
      <p class="section-kicker">Regeringsgrundlag</p>
      <h1>${escapeHtml(government.title)}</h1>
      <p class="lead">${government.year} · ${escapeHtml(government.typeLabel)} ${renderGovernmentStatus(
    government,
    governmentsData.governments
  )}</p>
      <p class="context">${escapeHtml(government.context || "")}</p>
      ${government.note ? `<p class="context">${escapeHtml(government.note)}</p>` : ""}
      ${renderGovernmentMeta(government, governmentsData.parties)}
      <p class="meta">Kildefil: ${escapeHtml(government.sourceFile || "Ukendt kildefil")}</p>
      ${
        government.sourcePath
          ? `<p class="meta"><a href="${escapeHref(government.sourcePath)}" target="_blank" rel="noreferrer">Åbn original PDF</a></p>`
          : ""
      }
      ${renderMetadataLink(government)}
    </header>

    <nav class="source-jump-nav" aria-label="Kildesektioner">
      <a href="#full-text">Fuld tekst</a>
      <a href="#topic-suggestions">Emneforslag</a>
    </nav>

    <section id="full-text" class="source-section">
      <h2>Fuld dokumenttekst</h2>
      ${
        fullText
          ? `<article class="source-text">${renderFullText(fullText)}</article>`
          : '<div class="empty">Fuldtekst er ikke tekstudtrukket endnu. Den originale PDF kan åbnes via linket ovenfor.</div>'
      }
    </section>

    <section id="topic-suggestions" class="source-section">
      <h2>Emneforslag fra analysen</h2>
      <p class="meta">Emnerne er automatiske læseindgange. Primært emne styrer navigationen; sekundære og brede emnesignaler viser relevant indhold i bredere dokumentafsnit.</p>
      ${renderTopicBlocks(government.id, taxonomy.topics, suggestions)}
    </section>
  `;

  document.title = `${government.title} · Regeringsgrundlag`;
}

init().catch((error) => {
  root.innerHTML = '<div class="empty">Kunne ikke indlæse kilden.</div>';
  console.error(error);
});
