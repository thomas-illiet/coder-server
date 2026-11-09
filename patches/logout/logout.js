// Runs in the browser, in the same module scope as code-server's workbench.
// The applicator substitutes the JSON value from config.json for this token.
// JSON encoding protects quotes and backslashes; no configuration is evaluated.
((config) => {
  // 4.145.2 aliases: Qe = CommandsRegistry, Ae = MenuRegistry,
  // O.GlobalActivity = the bottom-left Manage (gear) menu.
  // A distinct ID leaves code-server's built-in logout command untouched.
  Qe.registerCommand('code-server.customLogout', () => {
    // Same-tab navigation. The destination is responsible for ending the session.
    window.location.assign(config.logoutUrl);
  });

  // The last group places Logout after the standard configuration commands.
  // No auth condition: external authentication deployments can use this too.
  Ae.appendMenuItem(O.GlobalActivity, {
    group: 'z_logout',
    order: 1000,
    command: {
      id: 'code-server.customLogout',
      title: 'Logout',
    },
  });
})(__CODE_STATION_CONFIG__);
