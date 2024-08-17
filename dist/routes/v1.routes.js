"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const country_state_city_1 = require("country-state-city");
const router = (0, express_1.Router)();
router.get("/countries", (req, res) => {
    const countries = country_state_city_1.Country.getAllCountries();
    return res.json(countries);
});
router.get("/states", (req, res) => {
    const countryCode = req.query.country;
    const states = country_state_city_1.State.getStatesOfCountry(countryCode);
    return res.json(states);
});
router.get("/cities", (req, res) => {
    const countryCode = req.query.country;
    const stateCode = req.query.state;
    const cities = country_state_city_1.City.getCitiesOfState(countryCode, stateCode);
    return res.json(cities);
});
exports.default = router;
