import { Router, Request, Response } from 'express';
import { Country, State, City } from "country-state-city";
const router = Router();

router.get("/countries", (req: Request, res: Response) => {
    const countries = Country.getAllCountries()
    const simplifiedCountries = countries.map(country => ({
        name: country.name,
        isoCode: country.isoCode
    }));
    return res.json(simplifiedCountries);
});

router.get("/states", (req, res) => {
    const countryCode = req.query.country as string;
    const states = State.getStatesOfCountry(countryCode);
    const simplifiedStates = states.map(state => ({
        name: state.name,
        isoCode: state.isoCode,
        countryCode: state.countryCode
    }));
    return res.json(simplifiedStates);
});

router.get("/cities", (req, res) => {
    const countryCode = req.query.country as string;
    const stateCode = req.query.state as string;
    const cities = City.getCitiesOfState(countryCode, stateCode)
    const simplifiedCities = cities.map(city => ({
        name: city.name,
    }));
    return res.json(simplifiedCities);
})

export default router;