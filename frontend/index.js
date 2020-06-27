import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    TablePickerSynced,
    Input,
    Label,
    FormField,
    FieldPickerSynced,
    Button,
    settingsButton,
    useSettingsButton,
} from '@airtable/blocks/ui';
import React, {useState, useEffect} from 'react';

function SeatingChartBlock() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    var newChartDisabled = false;
    var existingChartDisabled = false;

    const [showNewChart, setShowNewChart] = useState(false);
    const [loadExistingChart, setLoadExistingChart] = useState(false);

    if (isShowingSettings) {
        return <SettingsComponent />;
    } else if (!showNewChart && !loadExistingChart) {
        return <div>
            <Button disabled={newChartDisabled} onClick={() => setShowNewChart(true)} icon="cog">
                Create a New Seating Chart
            </Button>

            <Button disabled={existingChartDisabled} onClick={() => setLoadExistingChart(true)} icon="download">
                Load an Existing Seating Chart
            </Button>

            <Button
                onClick={() => setIsShowingSettings(true)}
                icon="settings"
                aria-label="Settings">Settings
            </Button>
        </div>;
    } else if (showNewChart && !loadExistingChart) {
        return <NewSeatingChart />;
    } else if (loadExistingChart && !showNewChart) {
        return <LoadExistingSeatingChart />;
    } else {
        return <div>ERROR, try refreshing the page.</div>;
    }
}

// settings component
function SettingsComponent() {
    //not need settings until want to click load existing or until try to save old?

    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const dataTable = base.getTableByIdIfExists(dataTableId);

    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    return <div>

        <Label htmlFor="data-table-picker">Select table to store seating chart data</Label>
        <TablePickerSynced id="data-table-picker" globalConfigKey="dataTableId" />

        //get unique identifier field for each record?

        //need seating chart unique identifier??
        <Label htmlFor="chart-name-field-picker">Select field that contains the seating chart name</Label>
        <FieldPickerSynced id="chart-name-field-picker" table={dataTable} globalConfigKey="chartNameFieldId" />

        //check unique and that is lookup?
        <Label htmlFor="guest-name-field-picker">Select field that contains the guest lookup field</Label>
        <FieldPickerSynced id="guest-name-field-picker" table={dataTable} globalConfigKey="guestNameFieldId" />

        <Label htmlFor="table-num-field-picker">Select field that contains the table number</Label>
        <FieldPickerSynced id="table-num-field-picker" table={dataTable} globalConfigKey="tableNumFieldId" />

        <Label htmlFor="chair-num-field-picker">Select field that contains the chair number</Label>
        <FieldPickerSynced id="chair-num-field-picker" table={dataTable} globalConfigKey="chairNumFieldId" />

    </div>;
}

// new seating chart set-up function

function NewSeatingChart() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    const guestTableId = globalConfig.get('guestTableId');
    const relationshipFieldId = globalConfig.get('relationshipFieldId');

    const guestTable = base.getTableByIdIfExists(guestTableId);
    const relationshipField = guestTable ? guestTable.getFieldByIdIfExists(relationshipFieldId) : null;

    const [numTables, setTableValue] = useState("");
    const [numChairs, setChairValue] = useState("");

    // disable Generate Seating Chart button until fields are filled
    const buttonDisabled = numTables <= 0 || numTables == null || numChairs <= 0 ||  numChairs == null || guestTable == null || relationshipField == null;

    // note if number of guests exceeds capacity given

    var errorMessage = "";

    var guestTableLength = useRecords(guestTable).length;

    if (!buttonDisabled && numTables != null && numChairs != null && guestTableLength > numTables * numChairs) {
        errorMessage = "You do not have enough capacity to seat all your guests. If you click Generate Seating Chart, a chart will generate using the first " + numTables * numChairs + " people on your list.";
    }

    return <div>
        <Label htmlFor="guest-table-picker">Select table that contains guest data</Label>
        <TablePickerSynced id="guest-table-picker" globalConfigKey="guestTableId" />
        <Label htmlFor="relationship-field-picker">Select field that contains relationship data for each guest</Label>
        <FieldPickerSynced id="relationship-field-picker" table={guestTable} globalConfigKey="relationshipFieldId" />

        <FormField label="Number of Tables">
            <Input value={numTables} type="number" min="1" required={true} onChange={e => setTableValue(e.target.value)} />
        </FormField>

        <FormField label="Number of Chairs">
            <Input value={numChairs} required={true} min="1" type="number" onChange={e => setChairValue(e.target.value)} />
        </FormField>

        {errorMessage}

        <Button onClick={() => seatingAutomation()} disabled={buttonDisabled} icon="personalAuto">
            Generate Seating Chart
        </Button>

        //render seating chart when button is pressed

        //ask if store data
    </div>;
}

// pull existing seating chart

function LoadExistingSeatingChart() {
    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');

    const dataTable = base.getTableByIdIfExists(dataTableId);

    const records = useRecords(dataTable);

    //filter records by correct chart, then sort by table number and chair number
    //and pass to render function with number of tables and chairs

    //use settings for correct fields (update settings if errors)

    //have picker for seating chart name to use

    const guests = records.map(record => {
        return (
            <div key={record.id}>
                {record.name || 'Unnamed guest'}
            </div>
        );
    });

    //render seating chart

    return <div>
        <Label htmlFor="data-table-picker">Select table that contains existing seating chart data</Label>
        <TablePickerSynced id="data-table-picker" globalConfigKey="dataTableId" />
        {guests}
    </div>;
}

// Create seating chart automatic backend function

function seatingAutomation(records, numTables, numChairs) {
    console.log("Automated seating chart");

    // if no relationships, seat at random table with other people with no relationships

    // add loading icon

    // sort records by table number and then by seat

    // call seating chart map creation with number of tables and chairs
    const chart = renderSeatingChart(records, numTables, numChairs);

    return <div>{chart}</div>;
}

// Render the seating chart

function renderSeatingChart(records, numTables, numChairs) {

    var chart = "";

    for (var i = 0; i < numTables; i++) {

        chart += "<h2>Table " + i + 1 + "</h2><ol>";

        for (var j = 0; j < numChairs; j++) {
            chart += "<li>" + record[i * j].name + "</li>";
        }

        chart += "</ol>";

    }
    // sort by table and then
}

// Save seating chart data to file

function saveSeatingChartData(records, chartName) {

}

//drag and drop?, specific view for table?, check permissions

initializeBlock(() => <SeatingChartBlock />);
