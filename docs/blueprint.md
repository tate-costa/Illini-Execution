# **App Name**: RoutineRecorder

## Core Features:

- User Selection: Select a user from a dropdown menu to begin routine entry or editing.
- Routine Editing: Dynamically generate a table for event-specific routine editing (FX, PH, SR, VT, PB, HB) with fields for skill values. Vault is recorded using a 2x2 grid and each of the 8 events is put through a tool that can change numerical routines, accounting for the specific events to improve deductions. 
- Routine Submission: Transform entered routine data into a submission table, pre-filled with skill values and adding a 'deductions' column for user input.
- Deduction Tracking: Store submission timestamp, all routine entries that include deduction inputs, and computes routine status based on the number of entries (0 or 1) and stores these for persistent access across sessions.
- Conditional Button Display: Show 'Submit Routine' button only after routines are created or modified.
- Data Persistence: Utilize local storage to maintain routine data across user sessions (no database needed).

## Style Guidelines:

- Primary color: A calm blue (#6699CC) reminiscent of focused practice.
- Background color: Light, desaturated blue (#E6EBEF).
- Accent color: Muted orange (#D98880) for buttons and key interactions, to signal actionable elements without causing distraction.
- Body and headline font: 'PT Sans' (humanist sans-serif) for clarity and readability in tables and forms.
- Simple, minimalist icons to represent events (FX, PH, SR, VT, PB, HB).
- Clean, tabular layouts for routine entry and display to ensure information is easily scannable.