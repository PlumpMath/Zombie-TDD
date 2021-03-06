var express = require("express");
var faye = require("faye");

var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
  app.set("views", __dirname + "/views");
  app.set("view engine", "jade");
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + "/client_dependencies"));
  app.use(express.static(__dirname + "/public"));
  app.use(express.static(__dirname + "/lib"));
});

app.configure("development", function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
  app.use(express.errorHandler());
});

// Routes

var bayeux = new faye.NodeAdapter({ mount: "/faye", timeout: 45 });

var Z = {
  building: require("lib/shared/building"),
  eventHub: require("lib/shared/event-hub"),
  buildingController: require("lib/shared/building-controller"),
  renderBuilding: require("lib/shared/building-renderer")
};

var building = Z.building.create({
  zombies: 50,
  barricade: 7,
  rooms: [{ name: "Trapdoor" }],
  sleepers: 4
});

var hub = Z.eventHub.create(bayeux.getClient());

var controller = Z.buildingController.create({
  building: building,
  hub: hub
}).init();

app.get("/capture", function (req, res) {
  res.render("capture", {
    title: "Capture the building"
  });
});

app.get("/building", function (req, res) {
  res.render("building", {
    title: "Zombie TDD",
    buildingHTML: Z.renderBuilding(building)
  });
});

app.get("/current-building.json", function (req, res) {
  res.send(JSON.stringify(building));
});

bayeux.attach(app);
app.listen(3000);

console.log("Express server listening on port %d in %s mode",
            app.address().port,
            app.settings.env);
