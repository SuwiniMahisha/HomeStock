import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from './Sidebar'; // Import Sidebar component
import "../css/shoppingList.css";
import useFetchReminders from "../hooks/useFetchReminders"; // Import hook to fetch reminders
import Swal from 'sweetalert2'; // Import SweetAlert2
import { jsPDF } from "jspdf"; // Import jsPDF
 

const SmartShoppingList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const reminderCount = useFetchReminders(); // Get reminder count using custom hook

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("http://localhost:8090/api/shopping-list");
        setItems(response.data.items || []);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, [reminderCount]);

  const handleReadyToShop = async () => {
    try {
      const seasonalResponse = await axios.get("http://localhost:8090/api/seasonal-reminders/active");
      const activeSeasonalReminders = seasonalResponse.data || [];

      const nonExpiringResponse = await axios.get("http://localhost:8090/api/reminders/non-expiring?showReminders=true");
      const activeNonExpiringReminders = nonExpiringResponse.data || [];

      const totalReminders = activeSeasonalReminders.length + activeNonExpiringReminders.length;

      localStorage.setItem("reminderCount", totalReminders);
      localStorage.setItem("storedReminders", JSON.stringify([...activeSeasonalReminders, ...activeNonExpiringReminders]));
      localStorage.setItem("readyToShopClicked", "true");

      window.dispatchEvent(new Event("storage"));
      navigate("/reminders");
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const handleAddItem = async () => {
    if (newItem.trim() === "") return;
    if (items.includes(newItem.trim())) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops!',
        text: 'This item is already in the list.',
      });
      return;
    }
    try {
      await axios.post("http://localhost:8090/api/shopping-list/add", { item: newItem.trim() });
      setNewItem("");
      setItems([...items, newItem.trim()]);
      Swal.fire({
        icon: 'success',
        title: 'Item Added!',
        text: `${newItem.trim()} has been added to your shopping list.`,
      });
    } catch (error) {
      console.error("Error adding item:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'There was an issue adding the item.',
      });
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(item)
        ? prevSelected.filter((i) => i !== item)
        : [...prevSelected, item]
    );
  };

  const handleEditItem = () => {
    if (selectedItems.length === 1) {
      setEditingItem(selectedItems[0]);
      setEditValue(selectedItems[0]);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || editValue.trim() === "") return;
    try {
      await axios.post("http://localhost:8090/api/shopping-list/update", {
        oldItem: editingItem,
        newItem: editValue.trim(),
      });
      setEditingItem(null);
      setEditValue("");
      setSelectedItems([]);
      setItems(items.map((item) => (item === editingItem ? editValue.trim() : item)));
      Swal.fire({
        icon: 'success',
        title: 'Item Updated!',
        text: `${editingItem} has been updated to ${editValue.trim()}.`,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'There was an issue updating the item.',
      });
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return Swal.fire({
      icon: 'warning',
      title: 'No Selection!',
      text: 'Please select items to remove.',
    });
    
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post("http://localhost:8090/api/shopping-list/remove", { itemsToRemove: selectedItems });
          setItems(items.filter((item) => !selectedItems.includes(item)));
          setSelectedItems([]);
          Swal.fire({
            icon: 'success',
            title: 'Items Removed!',
            text: `${selectedItems.join(", ")} have been removed from the shopping list.`,
          });
        } catch (error) {
          console.error("Error removing items:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'There was an issue removing the items.',
          });
        }
      }
    });
  };

  const handleClearList = async () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to clear the entire shopping list?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete("http://localhost:8090/api/shopping-list/clear");
          setItems([]);
          setSelectedItems([]);
          Swal.fire({
            icon: 'success',
            title: 'List Cleared!',
            text: 'Your shopping list has been cleared.',
          });
        } catch (error) {
          console.error("Error clearing shopping list:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'There was an issue clearing the list.',
          });
        }
      }
    });
  };

  

  const handleDownloadPDF = async () => {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF();
  
      // Background Image (if desired)
      const backgroundUrl = '../images/bg.jpeg'; // Replace with the path to your background image
      doc.addImage(backgroundUrl, 'JPEG', 0, 0, 770, 100); // Adjust as needed
  
      // Logo (if desired)
      const logoUrl = '../images/logo.png'; // Replace with the path to your logo
      doc.addImage(logoUrl, 'PNG', 10, 8, 30, 30); // Adjust as needed
  
      // Title
      doc.setFontSize(24);
      doc.setTextColor(0, 128, 0); // Green color for the title
      doc.setFont("helvetica", "bold");
      doc.text("Shopping List", 45, 25); // Adjust the position as needed
  
      // Separator Line
      doc.setDrawColor(0, 0, 0);
      doc.line(10, 40, 200, 40);
  
      // Table Header Background
      doc.setFillColor(193, 225, 193); // Light green for header
      doc.rect(10, 45, 190, 12, "F"); // Filled rectangle for header background
      doc.setTextColor(0, 0, 0); // Black color for header text
  
      // Table Header Labels
      doc.setFontSize(12);
      doc.text("Item", 12, 53);
  
      // Add a line under the header
      doc.setDrawColor(0, 0, 0);
      doc.line(10, 55, 200, 55);
  
      // Add items to the PDF
      let yPosition = 60;
      items.forEach((item, index) => {
        const rowHeight = 10;
        const alternateColor = index % 2 === 0 ? [240, 240, 240] : [255, 255, 255]; // Alternate row colors
  
        // Set alternating row colors
        doc.setFillColor(...alternateColor);
        doc.rect(10, yPosition - 4, 190, rowHeight, "F"); // Row background color
  
        // Draw text for each item
        doc.setTextColor(0, 0, 0); // Black color for text
        doc.text(item, 12, yPosition); // Adjust position as needed
  
        // Increase yPosition for the next row
        yPosition += rowHeight;
      });
  
      // Footer Section: Page number and date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100); // Gray color for footer
      doc.text("Generated on: " + new Date().toLocaleString(), 10, yPosition + 10); // Date & time
      doc.text("Page " + doc.internal.getNumberOfPages(), 180, yPosition + 10); // Page number
  
      // Save the PDF
      doc.save("shopping_list.pdf");
  
      // Show success message after download
      Swal.fire({
        icon: 'success',
        title: 'Download Successful!',
        text: 'Your shopping list PDF has been downloaded.',
      });
    } catch (error) {
      console.error("Error downloading shopping list:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'There was an issue downloading the shopping list.',
      });
    }
  };
  

  return (
    <div className="shopping-list-container">
      <Sidebar className="sidebar" /> {/* Sidebar added here */}
      <div className="shopping-list-wrapper">
        <div className="shopping-list-section">
          <h1>Smart Shopping List</h1>
          <div className="button-container">
            <button className="reminders-btn" onClick={() => navigate("/reminders")}>Reminders ({reminderCount})</button>
            <button className="ready-to-shop-btn" onClick={handleReadyToShop}>Ready to Shop</button>
          </div>

          {/* Add Item Section */}
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="item-input"
            />
            <button className="Add" onClick={handleAddItem}>Add Item</button>
          </div>

          <ul>
            {items.map((item, index) => (
              <li key={index} className="shopping-list-item">
                {editingItem === item ? (
                  <>
                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                    <button className="Save" onClick={handleUpdateItem}>Save</button>
                    <button className="Cancel" onClick={() => setEditingItem(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{item}</span>
                    <input type="checkbox" checked={selectedItems.includes(item)} onChange={() => handleSelectItem(item)} className="checkbox" />
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="button-container">
            <button className="edit-selected-btn" onClick={handleEditItem} disabled={selectedItems.length !== 1}>Edit Selected</button>
            <button className="remove-selected-btn" onClick={handleRemoveSelected} disabled={selectedItems.length === 0}>Remove Selected</button>
            <button className="clear-list-btn" onClick={handleClearList}>Clear List</button>
            <button className="download-pdf-btn" onClick={handleDownloadPDF}>Download PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartShoppingList;
