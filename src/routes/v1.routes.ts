import { Router, Request, Response } from 'express';
import { Country, State, City } from "country-state-city"
const router = Router();

router.get("/countries", (req, res) => {
    const countries = Country.getAllCountries()
    return res.json(countries)
})
router.get("/states", (req, res) => {
    const countryCode = req.query.country as string;
    const states = State.getStatesOfCountry(countryCode);
    return res.json(states);
})
router.get("/cities", (req, res) => {
    const countryCode = req.query.country as string;
    const stateCode = req.query.state as string;
    const cities = City.getCitiesOfState(countryCode, stateCode)
    return res.json(cities)
})

export default router;