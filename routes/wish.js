const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();

const db = require('../data/database')

router.get('/wishclothes', async function(req, res) {
    const clothes = await db.getDb().collection('wish').find().toArray();
    console.log(clothes);
    console.log('wish');
    res.render('wishclothes', {clothes : clothes} ) ;
});

router.delete('/wishclothes/:id', async function(req, res) {
    const clothId = req.params.id;
    try {
        await db.getDb().collection('wish').deleteOne({ _id: new mongodb.ObjectId(clothId) });
        res.status(200).send();
    } catch (error) {
        console.error('Failed to delete the item:', error);
        res.status(500).send();
    }
});

module.exports = router;