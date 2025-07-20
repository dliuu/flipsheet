# Task List

## High Priority
-   [] Create flip analysis: allow the user to analyze how much money a property would make if they flipped it. Flipping a home means buying a run down home, usually fully gut renovating it, and selling it on the market as a new home.
    - [x] Create flip_analysis on Supabase, with mostly float fields and a FK linked to Property by its UUID (FINISHED).
    - [x] Make the property_page editable. If the user is the creator of the property, add an edit button. Make a clone of the property_page, that puts the property in edit mode, and allow the user to add the flip analysis to it.
    - [x] UI to layout input fields to the flip analysis page.
    - [] Calculation file to create calculations.
    - [] General re-organization of the property page in both the edit and live modes.
    - [] Allow a user to create a flip_analysis.
    - [] Read a flip analysis on the property_page load.

-   [] Create financial loan projections on a property

## Medium Priority

## Low Priority


## Completed

-   [x] Implement User Authentication flow
-   [x] Design database schema
-   [x] Write Properties to database
-   [x] Read Properties from database
-   [x] Load Properties onto its own property_page
