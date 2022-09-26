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

      let runDashboardTag
      let runDashboardUrl

      on('before:run', (runDetails) => {
        runDashboardUrl = runDetails.runUrl
        runDashboardTag = runDetails.tag
      })

      on('after:spec', (spec, results) => {
        if (!results.error) {
          console.log(spec)
          console.log(results)
        }
      })

      // make sure to return the config object
      // as it might have been modified by the plugin
      return config
    },
    baseUrl: 'http://localhost:8888',
    specPattern: 'cypress/e2e/**/*spec.{js,ts}',
  },
})
