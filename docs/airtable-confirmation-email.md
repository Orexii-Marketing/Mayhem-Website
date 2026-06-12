# Airtable Confirmation Email Setup

When a parent signs up for an event, their registration is saved to the **Registrations** table in Airtable. Airtable's built-in Automations feature can send a confirmation email automatically — no extra email service or code needed.

---

## Prerequisites

- You have an Airtable account with the Mayhem Athletics base open
- Your Airtable plan supports Automations (Free plan includes 100 automation runs/month; Pro is unlimited)
- The **Registrations** table has these fields:
  - `Participant Name` (Single line text)
  - `Parent Email` (Email)
  - `Parent Phone` (Phone number)
  - `Event` (Link to **Events** table)
  - `Registration Status` (Single select: Pending, Confirmed, Waitlisted, Cancelled)

---

## Step 1 — Open Automations

1. Open your Mayhem Athletics base in Airtable.
2. Click the **Automations** button in the top-right toolbar (lightning bolt icon).
3. Click **+ Create automation** (or **+ New automation**) in the left panel.
4. Give it a name: **Send confirmation email on signup**.

---

## Step 2 — Set the Trigger

1. Under **Trigger**, click **Choose a trigger**.
2. Select **When a record is created**.
3. Under **Table**, choose **Registrations**.
4. Click **Continue**.

> Airtable will ask you to test the trigger. Create a test registration record in the table (or use an existing one), then click **Find records** to load sample data. You need this to build the email template in Step 4.

---

## Step 3 — Add an Action

1. Click **+ Add action** below the trigger.
2. Select **Send an email**.

---

## Step 4 — Configure the Email

Fill in the fields as follows:

**To:**
Click the **+** button to insert a dynamic field → select **Registrations → Parent Email**

This ensures the email goes to the parent who just signed up.

**Subject:**
```
You're registered for {Event Name} — Mayhem Athletics
```
Click the **+** button to insert **Registrations → Event → Event Name** where `{Event Name}` appears.

If your Registrations table doesn't have a linked Event Name lookup field, use a fixed subject like:
```
You're signed up — Mayhem Athletics
```

**Message (HTML body):**

```
Hi there,

You're all set! Here are your registration details:

Athlete: {Participant Name}
Event: {Event Name}
Date: {Event Date}
Location: {Location}
Status: Pending

We'll confirm your spot as soon as we review registrations. If you have questions, reply to this email or visit mayhemathletics.com.

See you on the field!
— Mayhem Athletics Coaching Staff
```

Use the **+** buttons to insert dynamic fields from the **Registrations** record:
- `{Participant Name}` → Registrations → Participant Name
- `{Event Name}` → Registrations → Event → Event Name
- `{Event Date}` → Registrations → Event → Event Date
- `{Location}` → Registrations → Event → Location

> **Tip:** If linked Event fields aren't available in the dropdown, add **Lookup fields** to the Registrations table first (see the Lookup Fields note below).

**From name:** `Mayhem Athletics`

**Reply-to:** Your coaching staff email address (e.g. `coach@mayhemathletics.com`)

---

## Step 5 — Test and Enable

1. Click **Run test** to send a test email to a real address (temporarily change the **To** field to your own email).
2. Verify the email arrives with the correct content.
3. Change **To** back to the dynamic `{Parent Email}` field.
4. Toggle the automation **On** (green switch at the top).

---

## Lookup Fields (if needed)

If the Registrations → Event linked fields (Event Name, Event Date, Location) don't appear in the email builder, add Lookup fields to the Registrations table:

1. In the **Registrations** table, click **+** to add a new field.
2. Choose field type **Lookup**.
3. Under **Linked table**, select **Events**.
4. Under **Field to look up**, select **Event Name**. Save.
5. Repeat for **Event Date** and **Location**.
6. These lookup fields will now be available as dynamic variables in the email action.

---

## Updating Registration Status

After reviewing registrations, update each record's **Registration Status** field to **Confirmed**. You can add a second automation triggered by **When a record matches a condition** (Status = Confirmed) to send a separate "You're confirmed!" email with the same setup as above.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Automation doesn't fire | Check the trigger table is **Registrations**, not Events |
| Email goes to spam | Add SPF/DKIM records for your sending domain or use a custom SMTP (Airtable Pro) |
| Dynamic fields show as blank | Make sure Lookup fields are added to Registrations table |
| Hit the 100 runs/month limit | Upgrade to Airtable Pro or Team plan |
