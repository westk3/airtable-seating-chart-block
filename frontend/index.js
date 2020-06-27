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
} from '@airtable/blocks/ui';
import React, {useState, useEffect} from 'react';

function SeatingChartBlock() {

    var newChartDisabled = false;
    var existingChartDisabled = false;

    const [showNewChart, setShowNewChart] = useState(false);
    const [loadExistingChart, setLoadExistingChart] = useState(false);

    return <div>
        {!showNewChart && !loadExistingChart && <Button disabled={newChartDisabled} onClick={() => setShowNewChart(true)} icon="cog">
            Create a New Seating Chart
        </Button>}

        {!showNewChart && !loadExistingChart && <Button disabled={existingChartDisabled} onClick={() => setLoadExistingChart(true)} icon="download">
            Load an Existing Seating Chart
        </Button>}

        {showNewChart && !loadExistingChart && <NewSeatingChart />}

        {loadExistingChart && !showNewChart && <LoadExistingSeatingChart />}

        //home page navigation

    </div>;
}

// initial setup function
    //create seating chart save table, with link to guest table, seating chart name, table number, chair number

// edit settings later
function editSettings() {

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

    // note if number of guests exceeds capacity given

    var errorMessage = "";

    if (numTables != null && numChairs !=null && useRecords(guestTable).length > numTables * numChairs) {
        errorMessage = "You do not have enough capacity to seat all your guests. If you click Generate Seating Chart, a chart will generate using the first " + numTables * numChairs + " people on your list.";
    }

    const buttonDisabled = numTables == null || numChairs == null || guestTable == null || relationshipField == null;

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

        //disable generate chart button until fields are filled
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

    const records = useRecords(table);

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

function seatingAutomation(records) {
    console.log("Automated seating chart");

    // if no relationships, seat at random table with other people with no relationships

    // add loading icon

    // call seating chart map creation
    const chart = renderSeatingChart(records);

    return <div>{chart}</div>;
}

// Render the seating chart

function renderSeatingChart(records) {

}

// Save seating chart data to file

function saveSeatingChartData(records, chartName) {

}

//drag and drop?, specific view for table?, check permissions

initializeBlock(() => <SeatingChartBlock />);
