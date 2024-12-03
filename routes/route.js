const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.render('index');
});

router.get('/addclothes', function(req, res) {
    res.render('addclothes');
});

router.get('/brand', function(req, res) {
    res.render('brand');
});

router.get('/haul', function(req, res) {
    res.render('haul');
});

router.get('/about', function(req, res) {
    res.render('about');
});

module.exports = router;