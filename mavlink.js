import { MavSitl, minimal, common, ardupilotmega } from 'node-mavlink'

/** @type {import("node-mavlink").MavLinkPacketRegistry} */
const REGISTRY = {
  ...minimal.REGISTRY,
  ...common.REGISTRY,
  ...ardupilotmega.REGISTRY,
}

/**
 * MAVLink proxy plugin
 *
 * @returns {import("vite").Plugin} plugin
 */
// eslint-disable-next-line max-lines-per-function
export default async function mavlink() {
  const connection = new MavSitl()
  await connection.start()

  console.log('Connected to SITL')

  /** @type {import("vite").WebSocketServer} */
  let ws = null

  // eslint-disable-next-line complexity
  connection.on('data', packet => {
    const clazz = REGISTRY[packet.header.msgid]
    if (ws && clazz) {
      switch (packet.header.msgid) {
        case common.ParamValue.MSG_ID:
          const paramValue = packet.protocol.data(packet.payload, clazz)
          ws.send('param-value', paramValue)
          break

        case common.StatusText.MSG_ID:
          const statusText = packet.protocol.data(packet.payload, clazz)
          ws.send('status-text', statusText)
          break

        case common.TimeSync.MSG_ID:
          const timeSync = packet.protocol.data(packet.payload, clazz)
          ws.send('time-sync', { ts1: Number(timeSync.ts1) })
          console.log('>', timeSync)
          break

        case minimal.Heartbeat.MSG_ID:
          const heartbeat = packet.protocol.data(packet.payload, clazz)
          ws.send('heartbeat', heartbeat)
          break

        default:
          const data = packet.protocol.data(packet.payload, clazz)
          console.log('>', data)
      }
    }
  })

  return {
    name: 'custom-dev-events',
    configureServer(server) {
      // eslint-disable-next-line prefer-destructuring
      ws = server.ws
      server.ws.on('param-request-list', () => {
        console.log('Received request for parameters')
        connection.send(new common.ParamRequestList())
      })
      server.ws.on('save-param-value', data => {
        const command = new common.ParamSet()
        command.paramId = data.paramId
        command.paramValue = data.paramValue
        command.paramType = data.paramType
        connection.send(command)
        console.log('Received request for saving parameter value', data)
      })
    },
  }
}
