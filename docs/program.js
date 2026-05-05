const dataUrl = "./data/programs.json";
const root = document.getElementById("program-source-root");

function getProgramIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("program");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTopicBlocks(program, topics) {
  if (!program.topics || program.topics.length === 0) {
    return '<p class="meta">Ingen kuraterede emneuddrag endnu.</p>';
  }

  return program.topics
    .map((topicEntry) => {
      const topicLabel = topics.find((topic) => topic.id === topicEntry.topicId)?.label ?? topicEntry.topicId;
      const excerpts = topicEntry.excerpts
        .map((excerpt) => `<p class="excerpt">${escapeHtml(excerpt.text)}</p>`)
        .join("");

      return `
        <section class="source-topic">
          <h3>${escapeHtml(topicLabel)}</h3>
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

  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error(`Kunne ikke hente datafilen: ${response.status}`);
  }

  const data = await response.json();
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
      <p class="lead">${escapeHtml(partyName)} · ${program.year}</p>
      <p class="context">${escapeHtml(program.context || "")}</p>
      <p class="meta">Kildearkiv: ${escapeHtml(program.sourceFile || "Ukendt kildefil")}</p>
      ${
        program.externalUrl
          ? `<p class="meta"><a href="${program.externalUrl}" target="_blank" rel="noreferrer">Officiel programside</a></p>`
          : ""
      }
    </header>

    <section class="source-section">
      <h2>Kuraterede emneuddrag</h2>
      ${renderTopicBlocks(program, data.topics)}
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
