import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/reminder.css"; // Ensure the correct CSS is applied

const Reminder = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [handledItems, setHandledItems] = useState([]);
  const [nonExpiringReminders, setNonExpiringReminders] = useState([]);

  useEffect(() => {
    // Fetch seasonal reminders from localStorage
    const storedReminders = JSON.parse(localStorage.getItem("storedReminders")) || [];
    setReminders(storedReminders);

    // Fetch non-expiring reminders from localStorage (passed from SmartShoppingList)
    const storedNonExpiringReminders = JSON.parse(localStorage.getItem("activeNonExpiringReminders")) || [];
    setNonExpiringReminders(storedNonExpiringReminders);

    const fetchNonExpiringReminders = async () => {
      try {
        const response = await axios.get("http://localhost:8090/api/reminders/non-expiring?showReminders=true");
        setNonExpiringReminders(response.data);
      } catch (error) {
        console.error("Error fetching non-expiring reminders", error);
      }
    };
    fetchNonExpiringReminders();
  }, []);

  const handleAction = async (id, item, action) => {
    try {
      // Handle adding item to shopping list
      const shoppingListResponse = await axios.get("http://localhost:8090/api/shopping-list");
      const shoppingList = Array.isArray(shoppingListResponse.data) ? shoppingListResponse.data : [];
      const itemExists = shoppingList.some((shoppingItem) => shoppingItem.item === item);

      if (itemExists && action === "add") {
        console.log(`Item "${item}" is already in the shopping list.`);
        return; // Don't add again if the item already exists
      }

      if (action === "add") {
        // Add the seasonal/non-expiring item to the shopping list
        await axios.post("http://localhost:8090/api/shopping-list/add", { item, quantity: 1, isSeasonal: true });
      }

      // Handle non-expiring reminder update (same logic as seasonal reminders)
      const nonExpiringReminder = nonExpiringReminders.find(reminder => reminder._id === id);
      if (nonExpiringReminder) {
        await axios.post("http://localhost:8090/api/reminders/update", { itemId: id, action });
        setHandledItems((prev) => [...prev, item]);
      }

      // Remove the reminder from localStorage and update state
      const updatedReminders = reminders.filter((reminder) => reminder.item !== item);
      localStorage.setItem("storedReminders", JSON.stringify(updatedReminders));
      setReminders(updatedReminders);

      // Update reminder count dynamically
      const updatedNonExpiringReminders = nonExpiringReminders.filter((reminder) => reminder._id !== id);
      setNonExpiringReminders(updatedNonExpiringReminders); // Update the state to remove the handled item
      localStorage.setItem("activeNonExpiringReminders", JSON.stringify(updatedNonExpiringReminders));

      // Update the reminder count
      const totalReminders = updatedReminders.length + updatedNonExpiringReminders.length;
      localStorage.setItem("reminderCount", totalReminders);
      window.dispatchEvent(new Event("storage"));

      // Handle skip action
      if (action === "skip") {
        // Mark the reminder as skipped in the backend
        await axios.post("http://localhost:8090/api/reminders/skip", { itemId: id });

        // Remove the reminder from non-expiring reminders state and localStorage
        const updatedNonExpiringRemindersAfterSkip = nonExpiringReminders.filter((reminder) => reminder._id !== id);
        setNonExpiringReminders(updatedNonExpiringRemindersAfterSkip); // Update state after skipping
        localStorage.setItem("activeNonExpiringReminders", JSON.stringify(updatedNonExpiringRemindersAfterSkip)); // Update localStorage
      }

    } catch (error) {
      console.error("Error processing action:", error.message);
    }
  };

  return (
    <div className="reminder-container">
      <h2 className="reminder-title">Seasonal Reminders</h2>
      {reminders.filter(reminder => !handledItems.includes(reminder.item) && reminder.message).length === 0 ? (
        <p className="no-reminders-message">No active seasonal reminders.</p>
      ) : (
        <ul className="reminder-list">
          {reminders
            .filter(reminder => !handledItems.includes(reminder.item) && reminder.message) // Filter out reminders without a message
            .map((reminder, index) => (
              <li key={`${reminder._id}-${index}`} className="reminder-item"> {/* Ensure unique key using _id and index */}
                <span className="reminder-message">{reminder.message}</span>
                <button className="add-button" onClick={() => handleAction(reminder._id, reminder.item, "add")}>Add</button>
                <button className="skip-button" onClick={() => handleAction(reminder._id, reminder.item, "skip")}>Skip</button>
              </li>
            ))}
        </ul>
      )}

      <h2 className="reminder-title">Non-Expiring Item Reminders</h2>
      {nonExpiringReminders.length > 0 ? (
        nonExpiringReminders.map((reminder) => (
          <div key={reminder._id} className="non-expiring">
            <p className="reminder-message">{reminder.reminderMessage}</p>
            <button className="add-button" onClick={() => handleAction(reminder._id, reminder.itemName, "add")}>Add</button>
            <button className="skip-button" onClick={() => handleAction(reminder._id, reminder.itemName, "skip")}>Skip</button>
          </div>
        ))
      ) : (
        <p className="no-reminders-message">No non-expiring reminders.</p>
      )}

      <button className="shopping-list-button" onClick={() => navigate("/shopping-list")}>Go to Shopping List</button>
    </div>
  );
};

export default Reminder;
