export default function (app) {
  app.route('/_api/app-info').get((req, res) => {
    res.json({
      project: 'secure-real-time-multiplayer-game',
      status: 'ok',
      headers: res.getHeaders(),
    });
  });
}
