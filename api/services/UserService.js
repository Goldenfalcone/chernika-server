var q = require('q');
var _ = require('underscore');
var vkApi = require('../../lib/vkApi');
var imageUtils = require('../../utils/image');

module.exports = {

  login: function (vkId, accessToken, clientVkUser) {
    var self = this;

    return this.findByFilter({vkId: vkId})
      .then(function (user) {
        user = user || new User();

        function photosPromise() {
          return user.isNew ? vkApi.getUserPhotos(vkId).then(cropPhotos) : user.photos;
        }

        return q.all([vkApi.login(vkId, accessToken), photosPromise()])
          .spread(function (vkUser, photos) {
            user.vkId = vkUser.id;
            user.firstName = vkUser.first_name;
            user.sex = vkUser.sex;
            user.lastActivity = new Date();
            user.age = clientVkUser ? vkBdateToAge(clientVkUser.bdate) : vkBdateToAge(vkUser.bdate); //Not very wonderful
            user.photos = photos;

            if (user.isNew) {
              user.initSettings();
            }
            var deferred = q.defer();
            user.save(function (err) {
              if (!err) {
                deferred.resolve({id: user._id, confirmPolicy: user.confirmPolicy});
              } else {
                logger.info('Cannot save user: ', err);
                deferred.reject(err);
              }
            });
            return deferred.promise;
          });
      });
  },

  logout: function (params) {
    return this.rmDevice(params);
  },

  find: function (id) {
    return this.findByFilter({_id: id});
  },

  findByFilter: function (filter) {
    var deferred = q.defer();
    User.findOne(filter, function (err, user) {
      deferred.resolve(user);
      if (err) {
        logger.info('Cannot return user.');
      }
    });
    return deferred.promise;
  },

  getSettings: function (id) {
    return this.find(id)
      .then(function (user) {
        return user && user.settings;
      });
  },

  update: function (uId, update) {
    var deferred = q.defer();

    User.findByIdAndUpdate(uId, {$set: update}, {new: true}, function (err, res) {
      if (err) {
        logger.info('Cannot update user: ', err);
        deferred.reject(err);
      } else {
        deferred.resolve(res._doc)
      }
    });

    return deferred.promise;
  },

  updateActivity: function (PARAMS) {
    return this.update(params.userId, {
      lastActivity: new Date()
    })
  },

  updateSettings: function (params) {
    var self = this;
    return this.find(params.userId)
      .then(function (user) {
        var s = user.settings || {};
        s.enableFriends = params.enableFriends === true;
        s.distance = params.distance | 0;
        s.minAge = params.minAge | 0;
        s.maxAge = params.maxAge | 0;
        s.show = params.show | 0;

        user.settings = s;
        return self.save(user);
      });
  },

  updatePhotos: function (params) {
    var self = this;
    return this.find(params.userId)
      .then(function (user) {
        user.photos = params.photos ? params.photos : user.photos;
        return self.save(user);
      });
  },

  addDevice: function (params) {
    var self = this;
    var device = params.device;

    function isDeviceAlreadyAdded(userDevice) {
      return userDevice.token === device.token;
    }

    return this.find(params.userId)
      .then(function (user) {
        if (!user.devices.some(isDeviceAlreadyAdded)) {
          user.devices.push(device);
        }
        return self.save(user);
      });
  },

  rmDevice: function (params) {
    var self = this;
    var device = params.device;

    return this.find(params.userId)
      .then(function (user) {
        user.devices = _.filter(user.devices, function (d) {
          return device.token != d.token
        });
        return self.save(user);
      });
  },

  save: function (user) {
    var deferred = q.defer();
    user.save(function (err) {
      if (!err) {
        deferred.resolve(user._id);
      } else {
        logger.info('Cannot save user: ', err);
        deferred.reject(err);
      }
    });
    return deferred.promise;
  },

  getUserWithPhotos: function (userId, photoType) {
    return this.find(userId)
      .then(function (user) {
        if (!user) return {};
        return {
          _id: user._id,
          firstName: user.firstName,
          vkId: user.vkId,
          sex: user.sex,
          age: user.age,
          lastKnownPosition: user.lastKnownPosition,
          photos: user.photos
        }
      });
  },

  confirmPolicy: function (params) {
    var self = this;
    return this.find(params.userId)
      .then(function (user) {
        user.confirmPolicy = true;
        return self.save(user);
      });
  }
};

function vkBdateToAge(bdate) {
  var defaultAge = 22;
  if(!bdate) return defaultAge;
  var dateParts = bdate.split('.');
  if(dateParts.length < 3) return defaultAge;
  return new Date(new Date - new Date(dateParts[2], dateParts[1] - 1, dateParts[0])).getFullYear() - 1970
}

function cropPhotos(photos) {
  var cropPromises = [];

  photos = _.map(photos, function (p) {
    return getMaxSizes(p.sizes);
  });

  _.each(photos, function (p) {
    p && cropPromises.push(imageUtils.countCrop(p));
  });

  return q.all(cropPromises);
}

function getMaxSizes(sizes) {
  sizes = _.groupBy(sizes, function (s) {
    return s.type;
  });
  return sizes.z ? sizes.z[0] : (sizes.y ? sizes.y[0] : sizes.x && sizes.x[0]);
}
