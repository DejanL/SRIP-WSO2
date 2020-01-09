'use strict';


/**
 * Libraries
 */
const express = require("express");
const fs = require("fs");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');


/**
 * Parameters
 */
const PORT = 3000;
const HOST = "0.0.0.0";
const app = express();
const routerApi = express.Router();
const users = [
  { uporabniskoIme: "sripdemo", geslo: "sripdemo" }
];
const jwtPassword = "Secure, isn't it?";
const avtentikacija = expressJwt({
  secret: jwtPassword,
  userProperty: 'payload'
});


/**
 * Swagger
 */
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "SRIP PMiS testni API strežnik",
      version: "1.0.0",
      description: "Testni API-ji v okviru projekta SRIP PMiS"
    },
    license: {
      name: "GNU LGPLv3",
      url: "https://choosealicense.com/licenses/lgpl-3.0"
    },
    contact: {
      name: "Dejan Lavbič",
      url: "https://www.lavbic.net",
      email: "dejan@lavbic.net"
    },
    servers: [ { url: "https://srip.lavbic.net/demo/api" } ]
  },
  apis: ['./server.js']
};
const swaggerDocument = swaggerJsdoc(swaggerOptions);


/**
 * Router
 */
app.use(express.json());
app.use('/demo/api', routerApi);
routerApi.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((req, res, next) => { res.redirect("/demo/api/docs"); next(); });
app.use((err, req, res, next) => {
  if (err.name == "UnauthorizedError") {
    res.status(401).json({
      status: "napaka",
      opis: err.name + ": " + err.message
    });
  }
  next();
});

routerApi.get("/swagger.json", (req, res) => {
  res.status(200).json(swaggerDocument);
});


/**
 * @swagger
 * tags:
 *  - name: Kraji
 *    description: Slovenski kraji, poštne številke in GPS koordinate
 * components:
 *  schemas:
 *    Kraj:
 *      type: object
 *      required:
 *        - postnaStevilka
 *        - kraj
 *        - lat
 *        - lng
 *      properties:
 *        postnaStevilka:
 *          type: integer
 *          description: poštna številka
 *        kraj:
 *          type: string
 *          description: kraj
 *        lat:
 *          type: number
 *          description: zemljepisna širina
 *        lng:
 *          type: number
 *          description: zemljepisna dolžina
 *        razdalja:
 *          type: number
 *          description: razdalja od trenutne lokacije
 *      example:
 *        postnaStevilka: 3000
 *        kraj: Celje - dostava
 *        lat: 45.5916
 *        lng: 14.1546
 */
let kraji = fs.readFileSync("SI.txt", "utf8")
 .split("\n").filter(x => x.length > 0)
 .map(x => {
   x = x.split("\t");
   return {
     postnaStevilka: parseInt(x[1], 10),
     kraj: x[2],
     lat: parseFloat(x[9], 10),
     lng: parseFloat(x[10], 10)
   };
 });


/**
 * @swagger
 * tags:
 *  - name: Prazniki
 *    description: Slovenski prazniki od leta 2000 do leta 2030
 * components:
 *  schemas:
 *   Praznik:
 *    type: object
 *    properties:
 *     datum:
 *      type: string
 *      format: date
 *      example: "2000-01-01"
 *     imePraznika:
 *      type: string
 *      description: ime praznika
 *      example: novo leto
 *     danVTednu:
 *      type: string
 *      description: dan v tednu
 *      example: sobota
 *     delaProstDan:
 *      type: boolean
 *      description: dela prost dan
 *      example: true
 *     mesec:
 *      type: integer
 *      example: 1
 *     leto:
 *      type: integer
 *      example: 2000
 *    required:
 *     - datum
 *     - imePraznika
 *     - danVTednu
 *     - delaProstDan
 *     - mesec
 *     - leto
 */
let prazniki = fs.readFileSync("./prazniki-in-dela-prosti-dnevi.csv", "utf8")
  .split("\r\n").filter(x => x.length > 0 && x.indexOf("DATUM") == -1)
  .map(x => {
     x = x.split(";");
     return {
       datum: x[6] + "-" + (x[5].length == 1 ? "0" : "") + x[5] + "-" +
         (x[4].length == 1 ? "0" : "") + x[4],
       imePraznika: x[1],
       danVTednu: x[2],
       delaProstDan: x[3] == "da",
       dan: parseInt(x[4], 10),
       mesec: parseInt(x[5], 10),
       leto: parseInt(x[6], 10)
     };
   });


/**
 * @swagger
 * tags:
 *  - name: Kulturne dediščine
 *    description: Register nepremičnin slovenske kulturne dediščine
 * components:
 *  schemas:
 *   KulturnaDediscina:
 *    type: object
 *    properties:
 *     ESD:
 *      type: integer
 *      description: evidenčna številka dediščine
 *      example: 440
 *     Ime:
 *      type: string
 *      example: Velenje - Mestno jedro
 *     Sinonimi:
 *      type: string
 *      example: Velenje, Novo Velenje, Titovo Velenje
 *     Zvrst:
 *      type: string
 *      example: naselja in njihovi deli
 *     Tip:
 *      type: string
 *      example: naselbinska dediščina
 *     Gesla:
 *      type: string
 *      example: mestno jedro
 *     Opis:
 *      type: string
 *      example: "Velenje je značilno razloženo mestno jedro, nastalo po 1945 iz vasi ob rudniku, v duhu novih mest v zelenju. Uradno mesto je nastalo 1959. Načrtovanje je vodil arhitekt Trenz."
 *     Datacija:
 *      type: string
 *      example: "tretja četrtina 20. stol., 1959"
 *     Avtorji:
 *      type: string
 *      example: "Ciril Pogačnik (gradbenik; 1959), Janez Trenz (urbanist; 1959), France Šmid (urbanist; 1959)"
 *     LokacijaOp:
 *      type: string
 *      description: opis lokacije
 *      example: "Mesto leži v Šaleški dolini, ob reki Paki in njenih pritokih, med gradoma Velenje in Šalek ter rudnikom."
 *     Podrocja:
 *      type: string
 *      example: "urbanistična zgodovina, umetnostna zgodovina"
 *     Zavod:
 *      type: string
 *      example: "ZVKD Celje"
 *     Varstvo:
 *      type: string
 *      example: dediščina
 *     Občina:
 *      type: string
 *      example: VELENJE
 *     Y:
 *      type: integer
 *      example: 509261
 *     X:
 *      type: integer
 *      example: 135114
 *     WGSX:
 *      type: numeric
 *      description: zemljepisna širina
 *      example: 46.3600028388
 *     WGSY:
 *      type: numeric
 *      description: zemljepisna dolžina
 *      example: 15.1155056629
 *     razdalja:
 *      type: numeric
 *      description: razdalja do lokacije (pri iskanju po lokaciji)
 *      example: 0.858
 *    required:
 *     - ESD
 *     - Ime
 *     - Sinonimi
 *     - Zvrst
 *     - Tip
 *     - Gesla
 *     - Opis
 *     - Datacija
 *     - Avtorji
 *     - LokacijaOp
 *     - Podrocja
 *     - Zavod
 *     - Varstvo
 *     - Občina
 *     - Y
 *     - X
 *     - WGSX
 *     - WGSY
 */
let kulturneDediscine = fs
  .readFileSync("./register-nepremicnin-kulturne-dediscine.csv", "utf8")
  .split("\r\n").filter(x => x.length > 0 && x.indexOf("ESD") == -1)
  .map(x => {
    let y = "", narekovaj = false;
    for (let i = 0; i < x.length; i++) {
      narekovaj = (x[i] == "\"") ? !narekovaj : narekovaj;
      y += (x[i] == "," && !narekovaj) ? "\|" : x[i];
    }
    y = y
      .replace(/\"/g, "").replace(/\s+/g, " ")
      .split("\|");
    return {
      ESD: parseInt(y[0], 10),
      Ime: y[1],
      Sinonimi: y[2],
      Zvrst: y[3],
      Tip: y[4],
      Gesla: y[5],
      Opis: y[6],
      Datacija: y[7],
      Avtorji: y[8],
      LokacijaOp: y[9],
      Podrocja: y[10],
      Zavod: y[11],
      Varstvo: y[12],
      Obcina: y[13],
      Y: parseInt(y[14], 10),
      X: parseInt(y[15], 10),
      WGSX: parseFloat(y[16]),
      WGSY: parseFloat(y[17])
    };
  });


/**
 * @swagger
 * tags:
 *  - name: Finance
 *    description: Finančni podatki
 * components:
 *  schemas:
 *   Cena:
 *    type: object
 *    properties:
 *     date:
 *      type: string
 *      description: datum
 *     open:
 *      type: numeric
 *      description: cena ob odprtju
 *     high:
 *      type: numeric
 *      description: najvišja cena
 *     low:
 *      type: numeric
 *      description: najnižja cena
 *     close:
 *      type: numeric
 *      description: cena ob zaprtju
 *     volume:
 *      type: integer
 *      description: število transakcij
 *     adjusted:
 *      type: numeric
 *      description: prilagojena cena ob zaprtju (glede na izplačilo dividend, delitev delnice ipd.)
 *    required:
 *     - date
 *     - open
 *     - high
 *     - low
 *     - close
 *    example:
 *     date: "2020-01-13"
 *     open: 27.32
 *     high: 27.53
 *     low: 27.16
 *     close: 27.39
 *     volume: 5874400
 *     adjusted: 27.39
 *   Delnica:
 *    type: object
 *    properties:
 *     simbol:
 *      type: string
 *     podjetje:
 *      type: string
 *     sektor:
 *      type: string
 *     valuta:
 *      type: string
 *    required:
 *     - simbol
 *     - podjetje
 *     - sektor
 *     - valuta
 *    example:
 *     simbol: AAPL
 *     podjetje: Apple Inc.
 *     sektor: Information Technology
 *     valuta: USD
 */
let sp500 = fs.readFileSync("./yahoo.finance/index/SP500.csv", "utf8")
  .split("\n").filter(x => x.length > 0 && !x.startsWith("\"symbol\""))
  .map(x => {
    x = x.split(";");
    return {
      "simbol": x[0].replace(/\"/g, ""),
      "podjetje": x[1].replace(/\"/g, ""),
      "sektor": x[5].replace(/\"/g, ""),
      "valuta": x[7].replace(/\"/g, "")
    };
  });


/**
 * @swagger
 * tags:
 *  - name: Avtentikacija
 *    description: Obvladovanje uporabnikov
 * components:
 *  schemas:
 *    Uporabnik:
 *      type: object
 *      required:
 *        - uporabniskoIme
 *      properties:
 *        uporabniskoIme:
 *          type: string
 *          description: uporabniško ime
 *        geslo:
 *          type: string
 *          description: geslo
 *        jwtZeton:
 *          type: string
 *          description: JWT žeton
 *      example:
 *        uporabniskoIme: sripdemo
 *        geslo: sripdemo
 *    Napaka:
 *      type: object
 *      required:
 *        - status
 *        - opis
 *      properties:
 *        status:
 *          type: string
 *          description: status zahteve
 *        opis:
 *          type: string
 *          description: opis napake
 *      example:
 *        status: napaka
 *        opis: Parameter je zahtevan
 *  securitySchemes:
 *    bearerAuth:
 *      type: http
 *      scheme: bearer
 *      in: header
 *      name: Authorization
 *      bearerFormat: JWT
 *  security:
 *    bearerAuth: []
 */


/**
 * @swagger
 *  components:
 *   examples:
 *    ZahtevanEnolicniIdentifikator:
 *     summary: manjka enolični identifikator
 *     value:
 *      status: napaka
 *      opis: "Zahtevan je parameter enoličnega identifikatorja."
 *    ZahtevanOdgovor:
 *     summary: manjka odgovor
 *     value:
 *      status: napaka
 *      opis: "Zahtevan je parameter odgovora."
 *    NiJwtZetona:
 *     summary: ni JWT žetona
 *     value:
 *      status: napaka
 *      opis: "Ni pravice dostopa, ker manjka JWT žeton."
 *    NiPraviceDostopa:
 *     summary: ni pravice dostopa
 *     value:
 *      status: napaka
 *      opis: "Uporabnik nima ustreznih pravic dostopa."
 */


/**
 * @swagger
 *  components:
 *   examples:
 *    ManjkaSimbol:
 *     summary: simbol finančnega inštrumenta
 *     value:
 *      status: napaka
 *      opis: Zahtevan je parameter simbola finančnega inštrumenta
 *    ZacetekNeustrezen:
 *     summary: začetni datum
 *     value:
 *      status: napaka
 *      opis: Parameter začetnega datuma mora biti v zahtevani obliki YYYY-MM-DD (npr. 2020-01-15)
 *    KonecNeustrezen:
 *     summary: končni datum
 *     value:
 *      status: napaka
 *      opis: Parameter končnega datuma mora biti v zahtevani obliki YYYY-MM-DD (npr. 2020-01-20)
 */


/**
 * @swagger
 *  path:
 *    /kraji/vsi:
 *      get:
 *        summary: Seznam vseh slovenskih krajev
 *        tags: [Kraji]
 *        description: Vrni seznam slovenskih krajev, pripadajočih poštnih številk, zemljepisnih širin in dolžin
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/Kraj"
 */
routerApi.get("/kraji/vsi", (req, res) => { res.status(200).json(kraji); });


/**
 * @swagger
 *  path:
 *    /kraji/iskanje/postnaStevilka/{postnaStevilka}:
 *      get:
 *        summary: Iskanje kraja po poštni številki
 *        tags: [Kraji]
 *        description: Vrni slovenski kraj, pripadajočo poštno številko, zemljepisno širino in dolžino, glede na podano poštno številko
 *        parameters:
 *          - in: path
 *            name: postnaStevilka
 *            schema:
 *              type: integer
 *            required: true
 *            description: poštna številka
 *            example: 3000
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Kraj"
 *          "400":
 *            description: Napaka, poštna številka je zahtevan podatek
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevan je parameter poštne številke v obliki štirimestnega števila (npr. 3000).
 *          "404":
 *            description: Napaka, kraj s podano poštno številko ne obstaja
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Kraj s podano poštno številko ne obstaja.
 */
routerApi.get("/kraji/iskanje/postnaStevilka/:postnaStevilka", (req, res) => {
  let postnaStevilka = parseInt(req.params.postnaStevilka, 10);
  if (!isNaN(postnaStevilka)) {
    let result = kraji.filter(x => x.postnaStevilka == postnaStevilka);
    if (result.length == 0) {
      res.status(404).json({
        status: "napaka",
        opis: `Kraj s poštno številko ${postnaStevilka} ne obstaja.`
      });
    } else {
      res.status(200).json(result);
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevan je parameter poštne številke v obliki štirimestnega števila (npr. 3000)."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /kraji/iskanje/lokacija:
 *      get:
 *        summary: Iskanje bližnjih krajev glede na podano lokacijo in razdaljo
 *        tags: [Kraji]
 *        description: Vrni najbližje slovenski kraje s pripadajočimi poštnimi številkami, zemljepisnimi širinami in dolžinami ter razdaljo, glede na podano lokacijo
 *        parameters:
 *          - in: query
 *            name: lat
 *            schema:
 *              type: number
 *            required: true
 *            description: zemljepisna širina trenutne lokacije
 *            example: 46.050193
 *          - in: query
 *            name: lng
 *            schema:
 *              type: number
 *            required: true
 *            description: zemljepisna dolžina trenutne lokacije
 *            example: 14.468910
 *          - in: query
 *            name: razdalja
 *            schema:
 *              type: number
 *            required: false
 *            description: razdalja iskanja bližnjih lokacij v km (privzeto 20 km)
 *            example: 20
 *          - in: query
 *            name: stZadetkov
 *            schema:
 *              type: number
 *            required: false
 *            description: največje število zadetkov (privzeto 10)
 *            example: 10
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/Kraj"
 *          "400":
 *            description: Napaka, zemljepisna širina in dolžina sta zahtevana številčna podatka
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevani sta številčni vrednosti parametrov zemljepisne širine (lat) in dolžine (lng).
 *          "404":
 *            description: Napaka, v bližini ni krajev
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Na podani razdalji od trenutne lokacije ni bližnjih krajev.
 */
routerApi.get("/kraji/iskanje/lokacija", (req, res) => {
  let { lat, lng, razdalja, stZadetkov } = req.query;
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  razdalja = (razdalja == undefined) ? 20 : parseFloat(razdalja);
  stZadetkov = (stZadetkov == undefined) ? 10 : parseInt(stZadetkov, 10);

  if (!isNaN(lat) && !isNaN(lng)) {
    let result = kraji
      .map(x => {
        x.razdalja = Math.round(distance(lat, lng, x.lat, x.lng, "K"));
        return x;
      })
      .filter(x => x.razdalja <= razdalja)
      .sort(function(a, b) {
        let primerjava = 0;
        if (a.razdalja == b.razdalja)
          primerjava = (a.postnaStevilka > b. postnaStevilka) ? 1 : -1;
        else
          primerjava = (a.razdalja > b. razdalja) ? 1 : -1;
        return primerjava;
      });
    if (result.length > 0) {
      stZadetkov = (stZadetkov > result.length) ? result.length : stZadetkov;
      res.status(200).json(result.slice(0, stZadetkov));
    } else {
      res.status(404).json({
        status: "napaka",
        opis: `Na razdalji ${razdalja} km od trenutne lokacije (${lat}, ${lng}) ni bližnjih krajev.`
      });
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevani sta številčni vrednosti parametrov zemljepisne širine (lat) in dolžine (lng)."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /kraji/dodajanje:
 *      post:
 *        security:
 *          - bearerAuth: []
 *        summary: Dodajanje novega kraja
 *        tags: [Kraji]
 *        description: Dodaj nov kraj s pripadajočo poštno številko, zemljepisno širino in dolžino, ki še ne obstaja
 *        requestBody:
 *          description: Podatki o kraju
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Kraj"
 *              example:
 *                postnaStevilka: 9999
 *                kraj: Indija Koromandija
 *                lat: 45.5
 *                lng: 14.4
 *        responses:
 *          "201":
 *            description: OK, kraj dodan
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Kraj"
 *          "401":
 *            description: Napaka, ni pravice dostopa
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Kraj"
 *                example:
 *                  status: napaka
 *                  opis: Ni pravice dostopa, ker manjka JWT žeton.
 *          "400":
 *            description: Napaka, poštna številka, kraj, lat in lng so vsi zahtevani podatki
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Poštna številka, kraj, lat in lng so vsi zahtevani podatki.
 *          "409":
 *            description: Napaka, kraj s podano poštno številko že obstaja
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Kraj s podano poštno številko že obstaja.
 */
routerApi.post("/kraji/dodajanje", avtentikacija, (req, res) => {
  let novKraj = req.body;
  if (typeof novKraj.postnaStevilka != "number" ||
      typeof novKraj.kraj != "string" ||
      typeof novKraj.lat != "number" ||
      typeof novKraj.lng != "number"
      ) {
    res.status(400).json({
      status: "napaka",
      opis: "Poštna številka, kraj, lat in lng so vsi zahtevani podatki in morajo biti vnaprej določenega podatkovnega tipa, kot to določa shema."
    });
  } else {
    let result = kraji.filter(x => x.postnaStevilka == novKraj.postnaStevilka);
    if (result.length > 0) {
      res.status(409).json({
        status: "napaka",
        opis: `Kraj s poštno številko ${novKraj.postnaStevilka} že obstaja.`
      });
    } else {
      kraji.push(novKraj);
      res.status(201).json(novKraj);
    }
  }
});


/**
 * @swagger
 *  path:
 *    /kraji/azuriranje/{postnaStevilka}:
 *      put:
 *        security:
 *          - bearerAuth: []
 *        summary: Posodabljanje obstoječega kraja
 *        tags: [Kraji]
 *        description: Posodobi obstoječi kraj s pripadajočo poštno številko, zemljepisno širino in dolžino
 *        parameters:
 *          - in: path
 *            name: postnaStevilka
 *            schema:
 *              type: integer
 *            required: true
 *            description: poštna številka
 *            example: 9999
 *        requestBody:
 *          description: Podatki o kraju
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Kraj"
 *              example:
 *                kraj: Volčji dol
 *                lat: 45.5
 *                lng: 14.4
 *        responses:
 *          "200":
 *            description: OK, kraj posodobljen
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Kraj"
 *          "400":
 *            description: Napaka, poštna številka, kraj, lat in lng so vsi zahtevani podatki
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Poštna številka, kraj, lat in lng so vsi zahtevani podatki.
 *          "404":
 *            description: Napaka, kraj s podano poštno številko ne obstaja
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Ne najdem kraja s podano poštno številko.
 */
routerApi.put("/kraji/azuriranje/:postnaStevilka", avtentikacija, (req, res) => {
    let postnaStevilka = parseInt(req.params.postnaStevilka, 10);
    let novKraj = req.body;
    novKraj.postnaStevilka = postnaStevilka;
    if (typeof novKraj.postnaStevilka != "number" ||
        typeof novKraj.kraj != "string" ||
        typeof novKraj.lat != "number" ||
        typeof novKraj.lng != "number"
        ) {
      res.status(400).json({
        status: "napaka",
        opis: "Poštna številka, kraj, lat in lng so vsi zahtevani podatki in morajo biti vnaprej določenega podatkovnega tipa, kot to določa shema."
      });
    } else {
      let result = kraji.filter(x => x.postnaStevilka == novKraj.postnaStevilka);
      if (result.length != 1) {
        res.status(404).json({
          status: "napaka",
          opis: `Ne najdem kraja s poštno številko ${novKraj.postnaStevilka}.`
        });
      } else {
        kraji = kraji.filter(x => x.postnaStevilka != postnaStevilka);
        kraji.push(novKraj);
        res.status(200).json(novKraj);
      }
    }
  });


/**
 * @swagger
 *  path:
 *    /kraji/brisanje/{postnaStevilka}:
 *      delete:
 *        security:
 *          - bearerAuth: []
 *        summary: Brisanje obstoječega kraja
 *        tags: [Kraji]
 *        description: Izbriši obstoječi kraj
 *        parameters:
 *          - in: path
 *            name: postnaStevilka
 *            schema:
 *              type: integer
 *            required: true
 *            description: poštna številka
 *            example: 9999
 *        responses:
 *          "204":
 *            description: OK
 *          "400":
 *            description: Napaka, poštna številka je zahtevan podatek
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevan je parameter poštne številke v obliki štirimestnega števila (npr. 3000).
 *          "404":
 *            description: Napaka, kraj s podano poštno številko ne obstaja
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Kraj s podano poštno številko ne obstaja.
 */
routerApi.delete("/kraji/brisanje/:postnaStevilka", avtentikacija, (req, res) => {
    let postnaStevilka = parseInt(req.params.postnaStevilka, 10);
    if (!isNaN(postnaStevilka)) {
      let result = kraji.filter(x => x.postnaStevilka == postnaStevilka);
      if (result.length == 0) {
        res.status(404).json({
          status: "napaka",
          opis: `Kraj s poštno številko ${postnaStevilka} ne obstaja.`
        });
      } else {
        kraji = kraji.filter(x => x.postnaStevilka != postnaStevilka);
        res.status(204).json(null);
      }
    } else {
      res.status(400).json({
        status: "napaka",
        opis: "Zahtevan je parameter poštne številke v obliki štirimestnega števila (npr. 3000)."
      });
    }
  });


/**
 * @swagger
 *  path:
 *    /prazniki/vsi:
 *      get:
 *        summary: Seznam slovenskih praznikov
 *        tags: [Prazniki]
 *        description: Vrni seznam slovenskih praznikov od leta 2000 do leta 2030
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/Praznik"
 */
routerApi.get("/prazniki/vsi", (req, res) => { res.status(200).json(prazniki); });


/**
 * @swagger
 *  path:
 *    /prazniki/iskanje/leto/{leto}:
 *      get:
 *        summary: Iskanje praznikov po letu
 *        tags: [Prazniki]
 *        description: Vrni slovenske praznike, s pripadajočimi podatki, glede na podano leto
 *        parameters:
 *          - in: path
 *            name: leto
 *            schema:
 *              type: integer
 *            required: true
 *            example: 2020
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Praznik"
 *          "400":
 *            description: Napaka, leto je zahtevan podatek
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevan je parameter leta v obliki štirimestnega števila (npr. 2020).
 *          "404":
 *            description: Napaka, leto mora biti v intervalu od 2000 do 2030
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevan parameter leta mora biti v intervalu od vključno 2000 do vključno 2030.
 */
routerApi.get("/prazniki/iskanje/leto/:leto", (req, res) => {
  let leto = parseInt(req.params.leto, 10);
  if (!isNaN(leto)) {
    if (leto < 2000 || leto > 2030) {
      res.status(404).json({
        status: "napaka",
        opis: "Zahtevan parameter leta mora biti v intervalu od vključno 2000 do vključno 2030."
      });
    } else {
      let result = prazniki.filter(x => x.leto == leto);
      res.status(200).json(result);
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevan je parameter leta v obliki štirimestnega števila (npr. 2020)."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /prazniki/iskanje/ime:
 *      get:
 *        summary: Iskanje praznikov po imenu
 *        tags: [Prazniki]
 *        description: Vrni slovenske praznike, s pripadajočimi podatki, glede na podano ime
 *        parameters:
 *          - in: query
 *            name: ime
 *            schema:
 *              type: string
 *            required: true
 *            description: ime praznika
 *            example: novo leto
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/Praznik"
 *          "400":
 *            description: Napaka, ime praznika je zahtevan podatek
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevano je ime praznika.
 *          "404":
 *            description: Napaka, praznik ne obstaja
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Praznik s podanim imenom ne obstaja.
 */
routerApi.get("/prazniki/iskanje/ime", (req, res) => {
  let { ime } = req.query;
  if (ime != undefined) {
    let result = prazniki.filter(x => x.imePraznika == ime);
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({
        status: "napaka",
        opis: `Praznik z imenom '${ime}' ne obstaja.`
      });
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevano je ime praznika."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /prazniki/sifrant:
 *      get:
 *        summary: Šifrant imen slovenskih praznikov
 *        tags: [Prazniki]
 *        description: Vrni seznam imen slovenskih praznikov
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: novo leto
 */
routerApi.get("/prazniki/sifrant", (req, res) => {
  let sifrantImen = [...new Set(prazniki.map(x => x.imePraznika))];
  return res.status(200).json(sifrantImen);
});


/**
 * @swagger
 *  path:
 *    /kulturneDediscine/vsi:
 *      get:
 *        security:
 *          - bearerAuth: []
 *        summary: Seznam nepremičnin slovenske kulturne dediščine
 *        tags: [Kulturne dediščine]
 *        description: Vrni seznam nepremičnin slovenske kulturne dediščine
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/KulturnaDediscina"
 *          "401":
 *            description: Napaka, ni pravice dostopa
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                examples:
 *                 ni JWT žetona:
 *                  $ref: "#/components/examples/NiJwtZetona"
 *                 ni pravice dostopa:
 *                  $ref: "#/components/examples/NiPraviceDostopa"
 */
routerApi.get("/kulturneDediscine/vsi", avtentikacija, (req, res) => {
  return res.status(200).json(kulturneDediscine);
});


/**
 * @swagger
 *  path:
 *    /kulturneDediscine/iskanje/ESD/{ESD}:
 *      get:
 *        summary: Iskanje kulturnih dediščin glede na evidenčno številko
 *        tags: [Kulturne dediščine]
 *        description: Vrni slovensko nepremičnino kulturne dediščine s pripadajočimi, glede na evidenčno številko
 *        parameters:
 *          - in: path
 *            name: ESD
 *            schema:
 *              type: integer
 *            required: true
 *            description: evidenčna številka dediščine
 *            example: 440
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *               schema:
 *                $ref: "#/components/schemas/KulturnaDediscina"
 *          "400":
 *            description: Napaka, evidenčna številka dediščine je zahtevani številčni podatek
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevan je parameter evidenčne številke dediščine.
 *          "404":
 *            description: Napaka, ne najdem nepremičnine kulturne dediščine
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Ne najdem nepremičnine kulturne dediščine s podano evidenčno številko.
 */
routerApi.get("/kulturneDediscine/iskanje/ESD/:ESD", (req, res) => {
  let ESD = parseInt(req.params.ESD, 10);
  if (!isNaN(ESD)) {
    let result = kulturneDediscine.filter(x => x.ESD == ESD);
    if (result.length == 1) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).json({
        status: "napaka",
        opis: `Ne najdem nepremičnine kulturne dediščine z evidenčno številko ${ESD}.`
      });
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevan je parameter evidenčne številke dediščine."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /kulturneDediscine/iskanje/lokacija:
 *      get:
 *        summary: Iskanje bližnjih kulturnih dediščin glede na podano lokacijo in razdaljo
 *        tags: [Kulturne dediščine]
 *        description: Vrni najbližje slovenski nepremičnine kulturne dediščine s pripadajočimi podatki ter razdaljo, glede na podano lokacijo
 *        parameters:
 *          - in: query
 *            name: lat
 *            schema:
 *              type: number
 *            required: true
 *            description: zemljepisna širina trenutne lokacije
 *            example: 46.050193
 *          - in: query
 *            name: lng
 *            schema:
 *              type: number
 *            required: true
 *            description: zemljepisna dolžina trenutne lokacije
 *            example: 14.468910
 *          - in: query
 *            name: razdalja
 *            schema:
 *              type: number
 *            required: false
 *            description: razdalja iskanja bližnjih nepremičnin kulturnih dediščin v km (privzeto 20 km)
 *            example: 20
 *          - in: query
 *            name: stZadetkov
 *            schema:
 *              type: number
 *            required: false
 *            description: največje število zadetkov (privzeto 10)
 *            example: 10
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/KulturnaDediscina"
 *          "400":
 *            description: Napaka, zemljepisna širina in dolžina sta zahtevana številčna podatka
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Zahtevani sta številčni vrednosti parametrov zemljepisne širine (lat) in dolžine (lng).
 *          "404":
 *            description: Napaka, v bližini ni nepremičnin kulturne dediščine
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Na podani razdalji od trenutne lokacije ni bližnjih nepremičnin kulturne dediščine.
 */
routerApi.get("/kulturneDediscine/iskanje/lokacija", (req, res) => {
  let { lat, lng, razdalja, stZadetkov } = req.query;
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  razdalja = (razdalja == undefined) ? 20 : parseFloat(razdalja);
  stZadetkov = (stZadetkov == undefined) ? 10 : parseInt(stZadetkov, 10);

  if (!isNaN(lat) && !isNaN(lng)) {
    let result = kulturneDediscine
      .map(x => {
        x.razdalja = /*Math.round(*/distance(lat, lng, x.WGSX, x.WGSY, "K")/*)*/;
        return x;
      })
      .filter(x => x.razdalja <= razdalja)
      .sort(function(a, b) {
        return (a.razdalja > b. razdalja) ? 1 : -1;
      });
    if (result.length > 0) {
      stZadetkov = (stZadetkov > result.length) ? result.length : stZadetkov;
      res.status(200).json(result.slice(0, stZadetkov));
    } else {
      res.status(404).json({
        status: "napaka",
        opis: `Na razdalji ${razdalja} km od trenutne lokacije (${lat}, ${lng}) ni bližnjih kulturnih dediščin.`
      });
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevani sta številčni vrednosti parametrov zemljepisne širine (lat) in dolžine (lng)."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /kulturneDediscine/sifrant/zvrsti:
 *      get:
 *        summary: Šifrant zvrsti nepremičnin slovenskih kulturne dediščine
 *        tags: [Kulturne dediščine]
 *        description: Vrni seznam zvrsti nepremičnin slovenske kulturne dediščine
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: naselja in njihovi deli
 */
routerApi.get("/kulturneDediscine/sifrant/zvrsti", (req, res) => {
  let sifrantZvrsti = [...new Set(kulturneDediscine.map(x => x.Zvrst))].sort();
  return res.status(200).json(sifrantZvrsti);
});


/**
 * @swagger
 *  path:
 *    /kulturneDediscine/sifrant/tipi:
 *      get:
 *        summary: Šifrant tipov nepremičnin slovenskih kulturne dediščine
 *        tags: [Kulturne dediščine]
 *        description: Vrni seznam tipov nepremičnin slovenske kulturne dediščine
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: naselbinska dediščina
 */
routerApi.get("/kulturneDediscine/sifrant/tipi", (req, res) => {
  let sifrantTipov = [...new Set(kulturneDediscine.map(x => x.Tip))].sort();
  return res.status(200).json(sifrantTipov);
});


/**
 * @swagger
 *  path:
 *    /finance/delnice/seznam:
 *      get:
 *        summary: Seznam delnic indeksa S&P 500
 *        tags: [Finance]
 *        description: Vrni seznam vseh delnic ameriškega indeksa S&P 500
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/Delnica"
 */
routerApi.get("/finance/delnice/seznam", (req, res) => {
  return res.status(200).json(sp500);
});


/**
 * @swagger
 *  path:
 *    /finance/delnice/cene/{simbol}:
 *      get:
 *        summary: Cene trgovalnih dni delnice
 *        tags: [Finance]
 *        description: Vrni cene delnic s pripadajočimi OHLC podatki in številom transakcij, glede na simbol finančnega inštrumenta
 *        parameters:
 *          - in: path
 *            name: simbol
 *            schema:
 *             type: string
 *            required: true
 *            description: simbol finančnega inštrumenta
 *            example: AAPL
 *          - in: query
 *            name: zacetek
 *            schema:
 *              type: string
 *              format: date
 *            description: začetni datum
 *            example: "2020-01-15"
 *          - in: query
 *            name: konec
 *            schema:
 *              type: string
 *              format: date
 *            description: končni datum
 *            example: "2020-01-20"
 *        responses:
 *          "200":
 *            description: OK
 *            content:
 *              application/json:
 *               schema:
 *                $ref: "#/components/schemas/Cena"
 *              text/csv:
 *               schema:
 *                $ref: "#/components/schemas/Cena"
 *          "400":
 *            description: Napaka, manjkajoči oz. neustrezni parametri
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                examples:
 *                 manjka simbol:
 *                  $ref: "#/components/examples/ManjkaSimbol"
 *                 začetek neustrezen:
 *                  $ref: "#/components/examples/ZacetekNeustrezen"
 *                 konec neustrezen:
 *                  $ref: "#/components/examples/KonecNeustrezen"
 *          "404":
 *            description: Napaka, ne najdem cen finančnega inštrumenta
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Ne najdem cen finančnega inštrumenta s podanim simbolom.
 */
routerApi.get("/finance/delnice/cene/:simbol", (req, res) => {
  let simbol = req.params.simbol;
  let { zacetek, konec } = req.query;
  if (simbol && simbol.length > 0) {
    if (zacetek != undefined && !/^\d{4}-\d{2}-\d{2}$/.test(zacetek)) {
      res.status(400).json({
        status: "napaka",
        opis: "Parameter začetnega datuma mora biti v zahtevani obliki YYYY-MM-DD (npr. 2020-01-15)."
      });
    } else if (konec != undefined && !/^\d{4}-\d{2}-\d{2}$/.test(konec)) {
      res.status(400).json({
        status: "napaka",
        opis: "Parameter končnega datuma mora biti v zahtevani obliki YYYY-MM-DD (npr. 2020-01-20)."
      });
    } else {
      let tip = (req.header('Accept') != undefined && req.header('Accept') == "text/csv") ? "csv" : "json";
      let cene = preberiCeneDelnic(simbol, zacetek, konec, tip);
      if (cene == null) {
        res.status(404).json({
          status: "napaka",
          opis: `Ne najdem cen finančnega inštrumenta ${simbol}.`
        });
      } else {
        res.status(200).json(cene);
      }
    }
  } else {
    res.status(400).json({
      status: "napaka",
      opis: "Zahtevan je parameter simbola finančnega inštrumenta."
    });
  }
});


/**
 * @swagger
 *  path:
 *    /avtentikacija/prijava:
 *      post:
 *        summary: Prijava uporabnika
 *        tags: [Avtentikacija]
 *        description: Prijava uporabnika z uporabniškim imenom in geslom ter generiranje JWT žetona za dostop
 *        requestBody:
 *          description: Podatki o uporabniku
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Uporabnik"
 *              example:
 *                uporabniskoIme: sripdemo
 *                geslo: sripdemo
 *        responses:
 *          "201":
 *            description: OK, uporabnik prijavljen in JWT žeton generiran
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Uporabnik"
 *                example:
 *                  jwtZeton: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cG9yYWJuaXNrb0ltZSI6InNyaXBkZW1vIiwiZGF0dW1HZW5lcmlyYW5qYSI6MTU3NzA3NjU3MywiaWF0IjoxNTc3MDc2NTczfQ.8k4SPAdPvn9cdKtioXZgCM_NBuZfeHU6dGcR5ya70Lg
 *          "400":
 *            description: Napaka, uporabniško ime in geslo sta zahtevana podatka
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Uporabniško ime in geslo sta zahtevana podatka.
 *          "401":
 *            description: Napaka, uporabniško ime in/ali geslo ni ustrezno
 *            content:
 *              application/json:
 *                schema:
 *                  $ref: "#/components/schemas/Napaka"
 *                example:
 *                  status: napaka
 *                  opis: Uporabniško ime in/ali geslo ni ustrezno.
 */
routerApi.post("/avtentikacija/prijava", (req, res) => {
  let uporabnik = req.body;
  if (typeof uporabnik.uporabniskoIme != "string" ||
      typeof uporabnik.geslo != "string"
      ) {
    res.status(400).json({
      status: "napaka",
      opis: "Poštna številka, kraj, uporabniško ime in geslo sta zahtevana podatka."
    });
  } else {
    let jePrijavljen = users.filter(x => {
      return x.uporabniskoIme == uporabnik.uporabniskoIme && x.geslo == uporabnik.geslo;
    }).length == 1;
    if (!jePrijavljen) {
      res.status(401).json({
        status: "napaka",
        opis: `Uporabniško ime in/ali geslo ni ustrezno.`
      });
    } else {
      uporabnik = {
        uporabniskoIme: uporabnik.uporabniskoIme,
        datumGeneriranja: parseInt(new Date().getTime() / 1000, 10)
      };
      res.status(201).json({ jwtZeton: jwt.sign(uporabnik, jwtPassword) });
    }
  }
});


/**
 * Calculate distance on Earth between given GPS points
 *
 * @param lat1 latitude of first GPS point
 * @param lng1 longitude of first GPS point
 * @param lat2 latitude of second GPS point
 * @param lng2 longitude of second GPS point
 */
let distance = (lat1, lng1, lat2, lng2, unit) => {
  if ((lat1 == lat2) && (lng1 == lng2)) {
    return 0;
  } else {
    var radlat1 = Math.PI * lat1/180;
    var radlat2 = Math.PI * lat2/180;
    var theta = lng1-lng2;
    var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = (dist > 1) ? 1 : dist;
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") { dist = dist * 1.609344; }
    if (unit == "N") { dist = dist * 0.8684; }
    return dist;
  }
};


/**
 * Preberi cene delnic
 *
 * @param simbol simbol delnice (npr. AAPL)
 * @param zacetek začetni datum (npr. "2020-01-15")
 * @param konec končni datum (npr. "2020-01-20")
 * @param tip tip izvoza (npr. "json" ali "csv")
 * @return JSON tabela, CSV niz ali null
 */
const preberiCeneDelnic = (simbol, zacetek, konec, tip = "json") => {
  let mapa = "./yahoo.finance/stock.prices/";
  let rezultat = null;
  if (simbol && simbol.length > 0 &&
    fs.existsSync(mapa + simbol.toUpperCase() + ".csv")) {
      rezultat = fs.readFileSync(mapa + simbol.toUpperCase() + ".csv", "utf8")
        .split("\n")
        .filter(x => x.length > 0 && !x.startsWith("\"date\""));
      rezultat = rezultat.map(x => {
        x = x.split(";");
        return {
          "date": x[0],
          "open": parseFloat(x[1].replace(/,/, ".")),
          "high": parseFloat(x[2].replace(/,/, ".")),
          "low": parseFloat(x[3].replace(/,/, ".")),
          "close": parseFloat(x[4].replace(/,/, ".")),
          "volume": parseInt(x[5].replace(/,/, "."), 10),
          "adjusted": parseFloat(x[6].replace(/,/, "."))
        };
      });
      if (zacetek != undefined || konec != undefined) {
        rezultat = rezultat.filter(x =>
          (zacetek == undefined || x.date >= zacetek) &&
          (konec == undefined || x.date <= konec)
        );
      }
      if (tip == "csv") {
        let sep = ";", newLine = "\n";
        rezultat =
          "\"date\";\"open\";\"high\";\"low\";\"close\";\"volume\";\"adjusted\"" +
          newLine +
          rezultat.map(x => {
          return "\"" + x.date + "\"" + sep + x.open + sep + x.high + sep +
            x.low + sep + x.close + sep + x.volume + x.adjusted;
        }).join(newLine);
      }
  }
  return rezultat;
};


/**
 * Start server
 */
app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
