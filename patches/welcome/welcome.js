// Browser code, not the patch applicator. Called by the native Welcome renderer.
// DOM APIs avoid HTML parsing and work with the existing Trusted Types policy.
// Configuration and CSS tokens are resolved once, while applying the patch.
function csRenderCodeStation(page) {
  // Filled by apply.cjs from config.json; treated as data, never HTML.
  const brand = __CODE_STATION_CONFIG__.welcome;
  const doc = page.window.document;

  const el = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) {
      node.className = className;
    }

    if (text !== undefined) {
      node.textContent = text;
    }

    return node;
  };

  // Release subscriptions from the previous render before building new DOM.
  page.categoriesSlideDisposables.clear();
  const main = el('main', 'cs-station');
  main.setAttribute('aria-label', brand.name + ' welcome');

  const style = el('style');
  style.textContent = __CODE_STATION_CSS__.replaceAll(
    '.cs-station',
    ':is(.monaco-workbench .part.editor > .content .gettingStartedContainer .cs-station)'
  );

  // Header: the small mark is text, so no image/font download is required.
  const logo = el('div', 'cs-brand');
  const mark = el('span', 'cs-mark', '>_');
  mark.setAttribute('aria-hidden', 'true');
  logo.append(mark, el('span', '', brand.name));

  const hero = el('header', 'cs-hero');
  hero.append(
    logo,
    el('p', 'cs-eyebrow', 'WELCOME TO YOUR WORKSPACE'),
    el('h1', '', brand.tagline),
    el('p', 'cs-intro', brand.description)
  );

  // Keep Welcome open, then delegate each action to VS Code. Errors remain visible.
  const run = async command => {
    try {
      await page.commandService.executeCommand('workbench.action.keepEditor');
      await page.commandService.executeCommand(command);
    } catch (error) {
      page.notificationService.error(error);
    }
  };

  const action = (label, description, icon, command, compact = false) => {
    const button = el('button', compact ? 'cs-tool' : 'cs-action');
    button.type = 'button';
    const glyph = el('span', 'codicon codicon-' + icon);
    glyph.setAttribute('aria-hidden', 'true');

    button.append(glyph, el(compact ? 'span' : 'strong', '', label));

    if (description) {
      button.append(el('small', '', description));
    }

    if (compact) {
      const shortcut = page.getKeybindingLabel(command);
      button.append(el('span', 'cs-key', shortcut));
    }

    button.addEventListener('click', () => run(command));
    return button;
  };

  const actions = el('section', 'cs-actions');
  actions.setAttribute('aria-label', 'Start working');
  actions.append(
    action(
      'Open a folder',
      'Bring your project into focus.',
      'folder-opened',
      'workbench.action.files.openFolder'
    ),
    action(
      'New file',
      'Start with a blank canvas.',
      'new-file',
      'workbench.action.files.newUntitledFile'
    ),
    action(
      'Open terminal',
      'Build, run and explore.',
      'terminal',
      'workbench.action.terminal.new'
    )
  );

  // Reuse VS Code's recent-project component, including open/remove behavior.
  // Its MutableDisposable replaces the previous list and owns its subscriptions.
  const recent = page.buildRecentlyOpenedList();
  recent.setLimit(5);
  const recentNode = recent.getDomElement();
  const recentHeading = recentNode.querySelector('h2');

  if (recentHeading) {
    recentHeading.textContent = 'Recent projects';
  }

  const tools = el('section', 'cs-tools');
  tools.append(
    el('h2', '', 'Make it yours'),
    el('p', 'cs-section-note', 'A few shortcuts to settle in.'),
    action('Command palette', '', 'terminal', 'workbench.action.showCommands', true),
    action('Settings', '', 'settings-gear', 'workbench.action.openSettings', true),
    action('Color theme', '', 'color-mode', 'workbench.action.selectTheme', true)
  );

  const lower = el('div', 'cs-lower');
  lower.append(recentNode, tools);

  // No footer or startup checkbox. The existing startup setting remains untouched.
  main.append(hero, actions, lower);

  // Replace only this editor's categories slide; explicit walkthroughs stay native.
  page.categoriesSlide.replaceChildren(style, main);

  // Recent projects arrive asynchronously: rescan the native scroll area afterward.
  const scan = () => page.categoriesPageScrollbar?.scanDomNode();
  page.categoriesSlideDisposables.add(recent.onDidChange(scan));
  page.registerDispatchListeners();
  page.setSlide('categories');
  scan();
}
