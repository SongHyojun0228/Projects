const express = require('express');
const mongodb = require('mongodb');
const axios = require('axios');
const cheerio = require('cheerio');

const db = require('../data/database');

const router = express.Router();

router.post('/submit-product', async function(req, res) {
    
    const newCloth = {
        product_name: req.body.product_name,
        brand: req.body.brand,
        category: req.body.category,
        price: req.body.price,
        site: req.body.site
    };

    try {
        const result = await db.getDb().collection('wish').insertOne(newCloth);
        console.log('추가 성공:', result);
        res.redirect('/wishclothes');
    } catch (error) {
        console.error('추가 에러:', error);
        res.status(500).render('500');
    }
});

module.exports = router;
