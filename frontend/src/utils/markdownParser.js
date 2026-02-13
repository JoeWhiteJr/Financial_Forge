/**
 * Pure utilities for parsing markdown content into structured data
 * for the enhanced guide pages (TOC, sections, slug IDs).
 */

export function generateSlugId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractTocFromMarkdown(markdown) {
  if (!markdown) return [];

  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length; // 2 or 3
    const text = match[2].trim();
    const id = generateSlugId(text);
    toc.push({ level, text, id });
  }

  return toc;
}

export function splitMarkdownBySections(markdown) {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let preambleLines = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h2Match) {
      // Save any preamble content before the first H2
      if (!currentSection && preambleLines.length > 0) {
        const preambleContent = preambleLines.join('\n').trim();
        if (preambleContent) {
          sections.push({
            id: '_preamble',
            title: null,
            content: preambleContent,
          });
        }
      }

      // Save previous section
      if (currentSection) {
        currentSection.content = currentSection.contentLines.join('\n').trim();
        delete currentSection.contentLines;
        sections.push(currentSection);
      }

      const title = h2Match[1].trim();
      currentSection = {
        id: generateSlugId(title),
        title,
        contentLines: [],
      };
    } else if (currentSection) {
      currentSection.contentLines.push(line);
    } else {
      preambleLines.push(line);
    }
  }

  // Push last section
  if (currentSection) {
    currentSection.content = currentSection.contentLines.join('\n').trim();
    delete currentSection.contentLines;
    sections.push(currentSection);
  }

  // Handle case where there are no H2 headings at all
  if (sections.length === 0 && preambleLines.length > 0) {
    sections.push({
      id: '_preamble',
      title: null,
      content: preambleLines.join('\n').trim(),
    });
  }

  return sections;
}

export function childrenToText(children) {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map(childrenToText).join('');
  }
  if (children.props?.children) {
    return childrenToText(children.props.children);
  }
  return '';
}
