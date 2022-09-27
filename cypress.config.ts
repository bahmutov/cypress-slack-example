import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: '9wrvf1',
  e2e: {
    video: false,
    env: {
      grepFilterSpecs: true,
      grepOmitFiltered: true,
    },
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // https://github.com/cypress-io/cypress-grep
      require('cypress-grep/src/plugin')(on, config)

      on('task', {
        getNumber() {
          return 42
        },
      })

      const notifyOnTestFailures = {
        // for the spec, list the channel and any specific users to notify
        // separated by spaces
        'adding-specs.ts': '#todomvc-adding-items-tests',
        'import-fixture-spec.ts': '#todomvc-fixtures-tests @gleb.bahmutov',
        'routing-spec.ts': '#todomvc-routing-tests',
        // TODO: add support for finding notifications by test tags
      }
      // https://github.com/bahmutov/cypress-slack-notify
      require('cypress-slack-notify')(on, notifyOnTestFailures)

      // make sure to return the config object
      // as it might have been modified by the plugin
      return config
    },
    baseUrl: 'http://localhost:8888',
    specPattern: 'cypress/e2e/**/*spec.{js,ts}',
  },
})
