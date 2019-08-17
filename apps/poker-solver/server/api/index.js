import { Server } from "@skypager/helpers-server";
import bodyParser from "body-parser";


export default class AppServer extends Server {
  /**
   * Right now we hard-code which endpoints the AppServer mounts,
   * however we could make this more dynamic to turn endpoints on or off
   * depending on what options are passed, what process.env variables are, etc.
   */
  static endpoints(options = {}, { runtime } = {}) {
    return runtime.fsx
      .readdirSync(runtime.resolve(__dirname, "endpoints"))
      .map(endpoint => endpoint.replace(/\.js$/, ""));
  }

  /**
   * We disable the default history configuration setup done by @skypager/helpers-server,
   * since we will be using the authenticated pages endpoints to serve our HTML conditionally
   * based on the user's cookies.
   */
  get history() {
    return true;
  }

  /**
   * Enable CORS support
   */
  get cors() {
    return true;
  }

  /**
   * Serve any css, js, images, or fonts as static files
   */
  get serveStatic() {
    return true;
  }

  appWillMount(app, options = this.options) {

    const game = this.runtime.game('texas-holdem', {
      players: 9,
      startingStack: 3000,
      blinds: [5, 10],
      gameId: 'chicago'
    })

    game.deal()

    this.runtime.gamesMap.set("chicago", game)
    
    app.use(bodyParser.json());
  }

  /**
   * @private
   * @see @skypager/helpers-server for information about Server class lifecycle hooks
  
   * This is a lifecycle hook called by the @skypager/helpers-server Server class,
   * it gets called after the endpoint routes have been loaded, and before the
   * history api and static file middlewares are added.
   */
  async appDidMount(app) {
    await this.runtime.fileDb.load()
    return app
  }
}
