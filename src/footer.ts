/**
 * Persistent Footer Component
 *
 * Renders a footer on all pages with:
 * - AEP / CognicellAI attribution
 * - Build-log / changelog framing area
 */

export function renderFooter(container: HTMLElement): void {
  container.innerHTML = "";
  container.classList.add("site-footer");

  const attribution = document.createElement("p");
  attribution.className = "site-footer__attribution";
  attribution.textContent =
    "Developed by the Autonomous Engineering Platform by CognicellAI";

  const buildLog = document.createElement("p");
  buildLog.className = "site-footer__build-log";

  const buildLogLink = document.createElement("a");
  buildLogLink.href = "#changelog";
  buildLogLink.textContent = "Build Log / Changelog";
  buildLog.appendChild(buildLogLink);

  container.appendChild(attribution);
  container.appendChild(buildLog);
}

export function getAttributionText(): string {
  return "Developed by the Autonomous Engineering Platform by CognicellAI";
}
