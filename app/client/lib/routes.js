Router.route('/', function () {
  this.render('index');
});

Router.route('/manage', function () {
  this.render('manage');
});


// Testing pages :)
Router.route('/empowerment', function () {
  this.render('empowerment');
});

Router.route('/flow', function () {
  this.render('flow');
});
