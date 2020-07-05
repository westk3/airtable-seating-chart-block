# Airtable Seating Chart Block

The Seating Chart Block is used to create and view automatically generated best-fit seating charts. The charts are automatically generated using given information about how guests are related to each other (stored in a linked record field). After a chart is generated, it may be saved to another table, so you can load that chart to look at it again, edit the chart, or use that data in another visualization block.

The anticipated user value of this block is to save time in the initial creation of seating charts. A best-fit chart will be created by placing people who know each other at the same table. Seating chart planners can then look over the chart and make adjustments as needed. 

## Settings and Initialization

The Seating Chart Block requires two tables, one for guest data and one to store seating chart data.

Guest Table

* One text field (containing the guest name)
* One linked record field (containing the relationships of the guest, each linked record links to another guest)

Seating Chart Data Table

* One text field (containing the seating chart name)
* One linked record field (linking to one record in the Guest table)
* Two number fields (one to denote the table number, one to denote the chair number)

## Creating a New Seating Chart

Select the number of tables and number of chairs you wish to generate a chart for. The best-fit seating chart algorithm will run and display the finished result. You can then choose to save the seating chart to the seating chart table or return to the home screen.

## Loading an Existing Seating Chart

Enter the name of the seating chart you wish to load. If it exists, the chart will appear. If not, you will be prompted to enter another chart name.
