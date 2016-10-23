const plugin = require('./')
const barracks = require('barracks')
const tape = require('blue-tape')

tape('require', t => {
  t.test('is a function', async (t) => {
    t.assert(typeof plugin === 'function', 'plugin is a function')
  })

  t.test('returns an object', async (t) => {
    const handlers = plugin()
    t.deepEqual(Object.keys(handlers), ['wrapSubscriptions', 'wrapEffects'], 'function returns object')
  })
})

tape('wraps effects', t => {
  t.test('sequential processing', async (t) => {
    const store = barracks()
    store.use(plugin())
    store.model({
      state: { name: '' },
      reducers: {
        appendToName: (state, data) => {
          return { name: state.name + data }
        }
      },
      effects: {
        saveMyName: async (state, data, send) => {
          let newState

          newState = await send('appendToName', 'Nathan')
          t.deepEqual(newState, { name: 'Nathan' }, 'updated state to Nathan')

          newState = await send('appendToName', ' ')
          t.deepEqual(newState, { name: 'Nathan ' }, 'updated state to Nathan ')

          newState = await send('appendToName', 'Herald')
          t.deepEqual(newState, { name: 'Nathan Herald' }, 'updated state to Nathan Herald')

          return newState
        }
      }
    })
    const createSend = store.start()
    const send = plugin.promisifySend(createSend('test'))

    t.deepEqual(store.state(), { name: '' }, 'state starts out empty')

    const newState = await send('saveMyName')

    t.deepEqual(store.state(), { name: 'Nathan Herald' }, 'newState is Nathan Herald')
    t.deepEqual(store.state(), newState, 'newState matches store.state()')
  })

  t.test('catches exceptions', async (t) => {
    const store = barracks()
    store.use(plugin())
    store.model({
      effects: {
        gonnaThrow: async (state, data, send) => {
          throw new Error('you asked for it')
        }
      }
    })
    const createSend = store.start()
    const send = plugin.promisifySend(createSend('test'))

    try {
      await send('gonnaThrow')
      t.fail("didn't throw - should have never made it here")
    } catch (e) {
      t.pass('threw')
    }
  })
})
