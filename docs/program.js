const dataUrl = "./data/programs.json";
const taxonomyUrl = "./data/analysis/topic_taxonomy.json";
const suggestionsUrl = "./data/analysis/topic_suggestions.json";
const root = document.getElementById("program-source-root");

function getProgramIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("program");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLatestProgramYear(programs, partyId) {
  const years = programs
    .filter((program) => program.partyId === partyId)
    .map((program) => Number(program.year));

  return Math.max(...years);
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

function renderTopicBlocks(programId, topics, suggestions) {
  const programSuggestions = suggestions.filter((item) => item.program_id === programId);

  if (programSuggestions.length === 0) {
    return '<p class="meta">Ingen emneforslag endnu.</p>';
  }

  const grouped = topics
    .map((topic) => ({
      ...topic,
      suggestions: programSuggestions.filter(
        (item) => item.primary_topic_id === topic.id || item.secondary_topic_id === topic.id
      ),
    }))
    .filter((topic) => topic.suggestions.length > 0);

  return grouped
    .map((topicEntry) => {
      const excerpts = topicEntry.suggestions
        .slice(0, 4)
        .map(
          (suggestion) => `
            <div class="excerpt-block">
              <p class="excerpt">${escapeHtml(suggestion.text)}</p>
              <p class="meta">${escapeHtml(suggestion.chunk_id)} · ${escapeHtml(
            suggestion.primary_topic_label
          )}</p>
            </div>
          `
        )
        .join("");

      return `
        <section class="source-topic">
          <h3>${escapeHtml(topicEntry.label)}</h3>
          <p class="meta">${topicEntry.suggestions.length} chunk(s) matcher dette emne.</p>
          ${excerpts}
        </section>
      `;
    })
    .join("");
}

function splitIntoParagraphs(rawText) {
  const lines = rawText
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

async function init() {
  const programId = getProgramIdFromUrl();
  if (!programId) {
    root.innerHTML = '<div class="empty">Mangler program-id i URL.</div>';
    return;
  }

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
  const program = data.programs.find((item) => item.id === programId);
  if (!program) {
    root.innerHTML = '<div class="empty">Programmet blev ikke fundet.</div>';
    return;
  }

  let fullText = "";
  if (program.fullTextPath) {
    const fullTextResponse = await fetch(program.fullTextPath);
    if (fullTextResponse.ok) {
      fullText = await fullTextResponse.text();
    }
  }

  const partyName = data.parties.find((party) => party.id === program.partyId)?.name ?? program.partyId;

  root.innerHTML = `
    <header class="source-header">
      <p class="section-kicker">Kildeside</p>
      <h1>${escapeHtml(program.title)}</h1>
      <p class="lead">${escapeHtml(partyName)} · ${program.year} ${renderProgramStatus(
    program,
    data.programs
  )}</p>
      <p class="context">${escapeHtml(program.context || "")}</p>
      <p class="meta">Kildearkiv: ${escapeHtml(program.sourceFile || "Ukendt kildefil")}</p>
      ${
        program.externalUrl
          ? `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`
          : ""
      }
    </header>

    <section class="source-section">
      <h2>Emneforslag fra analysen</h2>
      ${renderTopicBlocks(program.id, taxonomy.topics, suggestions)}
    </section>

    <section class="source-section">
      <h2>Fuld programtekst</h2>
      ${
        fullText
          ? `<article class="source-text">${renderFullText(fullText)}</article>`
          : '<div class="empty">Fuldtekst er endnu ikke tilgængelig for dette program.</div>'
      }
    </section>
  `;

  document.title = `${program.title} · Programkilde`;
}

init().catch((error) => {
  root.innerHTML = '<div class="empty">Kunne ikke indlæse programkilden.</div>';
  console.error(error);
});
