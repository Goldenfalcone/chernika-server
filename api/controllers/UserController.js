module.exports = {

  login: function (req, res, next) {
    if (!req.params.user_id || !req.params.access_token) {
      return res.send(400, 'Incorrect parameters');
    }
    UserService.login(req.params.user_id, req.params.access_token, req.params.vkUser)
      .then(function (user) {
        req.params.userId = user.id;
        req.params.confirmPolicy = user.confirmPolicy;
        return next();
      })
      .fail(function (error) {
        logger.error('Login error: ' + JSON.stringify(error));
        res.send(500, 'Internal error');
      });
  },

  logout: function (req, res) {
    UserService.logout(req.params)
      .then(function () {
        res.send(204);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  find: function (req, res) {
    UserService.find(req.params.userId)
      .then(function (user) {
        res.send(user || {});
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  getSettings: function (req, res) {
    UserService.getSettings(req.params.userId)
      .then(function (settings) {
        res.send(settings || {});
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  updateSettings: function (req, res) {
    UserService.updateSettings(req.params)
      .then(function () {
        res.send(204);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  updateActivity: function () {
    UserService.updateActivity(req.params)
      .then(function () {
        res.send(204);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  findPhotos: function (req, res) {
    UserService.getUserWithPhotos(req.params.userId, req.params.type)
      .then(function (user) {
        res.send(user.photos || []);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  updatePhotos: function (req, res) {
    UserService.updatePhotos(req.params)
      .then(function () {
        res.send(204);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  addDevice: function (req, res) {
    UserService.addDevice(req.params)
      .then(function () {
        res.send(204);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  },

  confirmPolicy: function (req, res) {
    UserService.confirmPolicy(req.params)
      .then(function () {
        res.send(204);
      })
      .fail(function (error) {
        res.send(500, 'Internal error');
      });
  }
};


