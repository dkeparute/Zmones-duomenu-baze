import express from "express";
import exphbs from "express-handlebars";
import { connect, query, end } from "./db.js";

const PORT = 3000;
const WEB = "web";

const app = express();

// HELPERIAI KVIECIAMI I PAGALBA SUFORMATUOTI DATA I STRINGA

app.engine("handlebars", exphbs({
    helpers: {
        dateFormat: (date) => {
            if (date instanceof Date) {
                let year = "0000" + date.getFullYear();
                year = year.substr(- 4);
                let month = "00" + (date.getMonth() + 1);
                // get month grazina nuo 0 iki 11 skaicius del to pridedame + 1
                month = month.substr(- 2);
                let day = "00" + date.getDate();
                day = day.substr(- 2);
                return `${year}-${month}-${day}`;
            }
            return date;
        }
    }
}));
// HELPERIU PABAIGA

app.set("view engine", "handlebars");

app.use(express.static(WEB, {
    index: ["index.html"],
}));
app.use(express.urlencoded({
    extended: true,
}));
// ent pointas
// ZMONIU SARASAS

app.get("/zmones", async (req, res) => {
    let conn;
    try {
        conn = await connect();
        const { results: zmones } = await query(conn, "select * from zmones",);
        // console.log(zmones);
        res.render("Zmones", { zmones });
    } catch (err) {
        res.render("Klaida", { err });
    } finally {
        await end(conn);
    }
});

// ZMONIU KONTAKTAI

app.get("/kontaktai", async (req, res) => {
    let conn;
    try {
        conn = await connect();
        const { results: kontaktai } = await query(conn,
            `select id, zmones_id, tipas, reiksme
        from kontaktai
        order by tipas`,);
        res.render("kontaktai", { kontaktai });
    } catch (err) {
        res.render("Klaida", { err });
    } finally {
        await end(conn);
    }
});

// reikia padaryti n pointa / kontaktas
app.get("/kontaktas/:id?", async (req, res) => {
    // tikrinam ar yra perduotas id parametras
    // id su klaustuku reiskia jog id gali buti arba nebuti
    // console.log("atejo id", req.params.id);
    if (req.params.id) {
        const id = parseInt(req.params.id);
        if (!isNaN(id)) {
            let conn;
            try {
                conn = await connect();
                const { results: kontaktai } = await query(conn,
                    `select id, tipas from kontaktai where id=?`, [id]);
                if (kontaktai.length > 0) {
                    // siame sarase yra 1 irsas (tas kurio mes ir ieskojom)
                    // generuojam forma su tuo irasu
                    res.render("kontaktas", { kontaktas: kontaktai[0] });
                } else {
                    // kontaktas su nurodytu id nerastas
                    res.redirect("/kontaktai");
                }
            } catch (err) {
                // jeigu ivyko klaida gaunant duomenis
                res.render("Klaida", { err });
            } finally {
                await end(conn);
            }
        } else {
            // Padave id ne skaiciu - dabar siunciam i kontaktu sarasa
            // o galim parodyt ir klaidos forma
            res.redirect("/kontaktai");
        }
    } else {
        // Naujo kontakto ivedimas
        res.render("kontaktas");
    }
});

app.listen(PORT, () => {
    console.log(`Zmones app listening at http://localhost:${PORT}`);
});

