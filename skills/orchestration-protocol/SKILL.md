---
name: orchestration-protocol
description: Schelet de protocol pentru coordonarea unei echipe de agenți AI - roluri, format de handoff, reguli de când descompui un task și când nu, praguri de escaladare. Extras din simulatorul fabricaai. STARE - schelet, nu încă validat.
metadata:
  status: schelet
  version: 0.0.1
---

# Protocol de orchestrare — schelet

Al doilea livrabil al proiectului `fabricaai`: regulile de coordonare extrase din joc și scrise ca instrucțiuni pentru un agent real.

Jocul te face să *simți* de ce delegarea costă. Acest skill îți dă regulile ca să construiești singur. Aproximativ 30% dintr-un sistem funcțional — scheletul, nu produsul finit.

> **Stare: schelet gol, intenționat.**
> Conținutul se scrie **după** ce regulile se dovedesc în simulare. Scris acum, ar fi opinie, nu protocol. Structura de mai jos fixează doar forma.

## Reguli de întreținere

1. **Un singur model conceptual.** Termenii de aici trebuie să fie exact termenii din joc. Dacă o regulă se schimbă în `src/sim/`, se actualizează și aici — și invers. Divergența dintre cele două le anulează pe amândouă.
2. **Fără dependență de framework sau limbaj.** Protocolul e text: roluri, format de handoff, praguri. Un exemplu de cod poate însoți, dar nu poate fi miezul — altfel îmbătrânește odată cu framework-ul.

---

## 1. Roluri

*(de completat)*

- **Orchestrator** — nu execută; alocă, oprește, escaladează.
- **Worker** — execută o singură frunză din arborele de task-uri.
- **Reviewer** — verifică rezultatul înainte de livrare.

## 2. Descompunerea unui task

*(de completat — regula centrală, validată în joc)*

Când descompui:
- ramurile sunt cu adevărat independente;
- fiecare ramură are un criteriu de terminare verificabil.

Când **nu** descompui:
- lanț secvențial — al doilea agent doar așteaptă;
- task-ul e mai mic decât costul de a explica contextul.

## 3. Formatul de handoff

*(de completat)*

Ce trece obligatoriu de la un agent la altul: obiectivul, constrângerile, ce s-a încercat deja, criteriul de acceptare, ce **nu** intră în sarcină.

## 4. Praguri de escaladare

*(de completat)*

Când un worker se oprește și întreabă, în loc să ghicească.

## 5. Costul coordonării

*(de completat — echivalentul textual al formulei din `src/sim/coordination.ts`)*

Capacitatea crește sub-liniar cu numărul de agenți; costul crește liniar. Deci există un număr optim de agenți per obiectiv, iar el depinde de forma arborelui de task-uri, nu de mărimea bugetului.

---

Context complet: `intent.md` și `spec.md` din rădăcina proiectului.
