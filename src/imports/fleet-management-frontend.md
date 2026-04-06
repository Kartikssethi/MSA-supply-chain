Create a modern responsive web frontend for a **Fleet Management / Supply Chain Management (SCM) platform**.

Technology stack:

* React (preferred) or Next.js
* TailwindCSS or Bootstrap for styling
* Axios or Fetch for API calls
* Chart library such as Chart.js or Recharts

The frontend should be designed as an **enterprise dashboard** used by logistics companies and fleet managers.

Main features/pages:

1. **Dashboard Page**

   * Overview cards showing:

     * Total Vehicles
     * Active Trips
     * Available Drivers
     * Vehicles Under Maintenance
   * Charts for:

     * Trips per day
     * Vehicle utilization
     * Delivery performance

2. **Vehicle Management Page**

   * Table displaying:

     * Vehicle ID
     * Vehicle Number
     * Vehicle Type
     * Capacity
     * Status (Available / In Transit / Maintenance)
   * Buttons:

     * Add Vehicle
     * Edit Vehicle
     * Remove Vehicle

3. **Driver Management Page**

   * Table listing drivers with:

     * Driver Name
     * License Number
     * Phone
     * Assigned Vehicle
     * Status

4. **Trip / Shipment Management Page**

   * Create new trips
   * Assign driver and vehicle
   * Display trip status (Planned / In Progress / Completed)
   * Show pickup and destination locations

5. **Fleet Tracking Page**

   * Map interface showing vehicle locations
   * Display vehicle markers on map
   * Clicking a vehicle shows:

     * Driver
     * Speed
     * Current trip
     * Estimated arrival time

6. **Maintenance Page**

   * Track vehicle maintenance schedules
   * Show service history
   * Add maintenance records

7. **Navigation**

   * Sidebar navigation with:

     * Dashboard
     * Vehicles
     * Drivers
     * Trips
     * Tracking
     * Maintenance

8. **UI Requirements**

   * Clean enterprise-style layout
   * Responsive design
   * Light and dark theme support
   * Use modern dashboard components

9. **API Integration**
   The frontend should fetch data from REST APIs such as:

   * GET /vehicles
   * POST /vehicles
   * GET /drivers
   * GET /trips
   * POST /trips
   * GET /tracking

Provide:

* Full React component structure
* Folder structure
* Example API calls
* Sample dummy data
* Clean reusable components
