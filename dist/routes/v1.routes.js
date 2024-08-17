"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const country_state_city_1 = require("country-state-city");
const router = (0, express_1.Router)();
router.get("/countries", (req, res) => {
    const countries = country_state_city_1.Country.getAllCountries();
    const simplifiedCountries = countries.map(country => ({
        name: country.name,
        isoCode: country.isoCode
    }));
    return res.json(simplifiedCountries);
});
router.get("/states", (req, res) => {
    const countryCode = req.query.country;
    const states = country_state_city_1.State.getStatesOfCountry(countryCode);
    const simplifiedStates = states.map(state => ({
        name: state.name,
        isoCode: state.isoCode,
        countryCode: state.countryCode
    }));
    return res.json(simplifiedStates);
});
router.get("/cities", (req, res) => {
    const countryCode = req.query.country;
    const stateCode = req.query.state;
    const cities = country_state_city_1.City.getCitiesOfState(countryCode, stateCode);
    const simplifiedCities = cities.map(city => ({
        name: city.name,
    }));
    return res.json(simplifiedCities);
});
exports.default = router;
