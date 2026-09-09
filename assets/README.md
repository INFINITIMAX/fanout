# assets/

## Regula licențelor

**Niciun asset nu intră în joc înainte ca sursa și licența lui să fie trecute în tabelul de mai jos.** Nu retroactiv, nu „o notez mai târziu”. Un proiect open-source cu licențe neclare pe artă nu poate fi nici publicat liniștit, nici vândut vreodată.

| Asset / pack | Autor | Sursă (URL) | Licență | Uz comercial | Atribuire cerută | Data |
|---|---|---|---|---|---|---|
| M PLUS Rounded 1c (400, 700, 800 · latin + latin-ext) | Coji Morishita / M+ Fonts Project | https://fonts.google.com/specimen/M+PLUS+Rounded+1c | SIL Open Font License 1.1 | Da | Nu (recomandată) | 09-09-2026 |

### Cum se adaugă un asset

1. Descarcă pack-ul în `assets/raw/`.
2. Deschide pagina sursă și citește licența efectivă — nu presupune din reputația site-ului.
3. Adaugă rândul în tabel, cu URL-ul **paginii**, nu al fișierului. Fără el, arta devine nereproductibilă pe alt calculator, pentru că `assets/raw/` nu intră în git.
4. Dacă licența cere atribuire, adaug-o și în `README.md` de la rădăcină.
5. Abia apoi exportă în `sprites/`, `tilesets/` etc.

Dacă licența nu e clară, asset-ul nu se folosește. Există suficient CC0 curat.

## Organizare

| Folder | Conținut | În git? |
|---|---|---|
| `raw/` | Pack-uri descărcate, fișiere sursă (`.aseprite`, `.psd`), arhive originale | **Nu** |
| `sprites/` | Personaje și obiecte exportate, folosite efectiv în joc | Da |
| `tilesets/` | Podele, pereți, mobilier de birou | Da |
| `ui/` | Iconițe, rame, elemente de HUD | Da |
| `audio/` | Sunet și muzică (v2) | Da |
| `fonts/` | Fonturi pixel | Da |

## Ordinea de lucru

Arta vine **după** ce simularea e validată cu dreptunghiuri colorate. Dacă jocul e plictisitor cu dreptunghiuri, e plictisitor și cu sprite-uri frumoase — iar atunci arta e doar timp pierdut peste o problemă de design.

## Surse recomandate (CC0)

- Kenney (kenney.nl) — pachete CC0, inclusiv uz comercial
- itch.io, filtrat pe licență CC0 / uz comercial permis

Verifică licența pe pagina fiecărui pack, nu presupune din reputația site-ului.
