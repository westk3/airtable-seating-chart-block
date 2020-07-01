//add styling, full screen vs. small screen,
//drag and drop?, specific view for table?, check permissions
//remove allow pick none
//add tooltips for disabled buttons

import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    settingsButton,
    useSettingsButton,
    Tooltip,
    TablePickerSynced,
    Input,
    Label,
    FormField,
    FieldPickerSynced,
    Button,
    Select,
} from '@airtable/blocks/ui';
import { FieldType } from '@airtable/blocks/models'
import React, {useState, useEffect} from 'react';

function SeatingChartBlock() {

    //explanation text?

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    });

    const [showNewChart, setShowNewChart] = useState(false);
    const [loadExistingChart, setLoadExistingChart] = useState(false);

    // show settings
    if (isShowingSettings) {
        return <SettingsComponent />;

    // show block options screen
    } else if (!showNewChart && !loadExistingChart) {
        return <div>
            <Button onClick={() => setShowNewChart(true)} icon="cog">
                Create a New Seating Chart
            </Button>

            <Button onClick={() => setLoadExistingChart(true)} icon="download">
                Load an Existing Seating Chart
            </Button>
        </div>;

    // show new seating chart screen
    } else if (showNewChart && !loadExistingChart) {
        return <NewSeatingChart />;

    // show load existing seating chart screen
    } else if (loadExistingChart && !showNewChart) {
        return <LoadExistingSeatingChart />;

    // error page -- show settings?
    } else {
        return <div>ERROR, try refreshing the page.</div>;
    }
}

// settings component
function SettingsComponent() {

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

        // check is text field
        <Label htmlFor="chart-name-field-picker">Select field that contains the seating chart name</Label>
        <FieldPickerSynced id="chart-name-field-picker" table={dataTable} allowedTypes={FieldType.TEXT} globalConfigKey="chartNameFieldId" />

        //check unique and that is lookup?
        <Label htmlFor="guest-name-field-picker">Select field that contains the guest lookup field</Label>
        <FieldPickerSynced id="guest-name-field-picker" table={dataTable} globalConfigKey="guestNameFieldId" />

        <Label htmlFor="table-num-field-picker">Select field that contains the table number</Label>
        <FieldPickerSynced id="table-num-field-picker" table={dataTable} allowedTypes={[FieldType.NUMBER]} globalConfigKey="tableNumFieldId" />

        <Label htmlFor="chair-num-field-picker">Select field that contains the chair number</Label>
        <FieldPickerSynced id="chair-num-field-picker" shouldAllowPickingNone={true} allowedTypes={[FieldType.NUMBER]} table={dataTable} globalConfigKey="chairNumFieldId" />

    </div>;
}

// new seating chart component

function NewSeatingChart() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    })

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

    var records = useRecords(guestTable);

    if (!buttonDisabled && numTables != null && numChairs != null && records.length > numTables * numChairs) {
        errorMessage = "You do not have enough capacity to seat all your guests. If you click Generate Seating Chart, a chart will generate using the first " + numTables * numChairs + " people on your list.";
    }

    const [generateChart, setGenerateChart] = useState(false);

    var chart;

    if (generateChart) {
        chart = seatingAutomation(records, numTables, numChairs);
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

        <Button onClick={e => setGenerateChart(true)} disabled={buttonDisabled} icon="personalAuto">
            Generate Seating Chart
        </Button>

        //render seating chart
        {generateChart && chart}

        //ask if store data, add loader icon while storing, success message for storing
        {generateChart && <Button onClick={() => saveSeatingChartData(records)} icon="upload">
            Store Data
        </Button>}
    </div>;
}

// load existing seating chart component

function LoadExistingSeatingChart() {

    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    })

    const base = useBase();

    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const dataTable = base.getTableByIdIfExists(dataTableId);
    const chartNameField = dataTable.getFieldByIdIfExists(chartNameFieldId);

    const sortOptions = {
        sorts: [
            {field: chartNameFieldId, direction: 'asc'},
            {field: tableNumFieldId, direction: 'asc'},
            {field: chairNumFieldId, direction: 'asc'},
        ],
        fields: [
            guestNameFieldId,
            chartNameFieldId,
            tableNumFieldId,
            chairNumFieldId,
        ]
    };

// test use records with things that don't exist
    const records = useRecords(dataTable, sortOptions);

    const [chartName, setChartName] = useState("");

    var buttonDisabled = true;

    if (chartName == "" || chartName == null) {

    } else {
        buttonDisabled = false;
    }

    const [renderChart, setRenderChart] = useState(false);

    var chart;
    var errorMessage = "";

    if (renderChart) {
        var maxTableNum = 0;
        var maxChairNum = 0;

        var guestNameArray = [];
        var tableNumArray = [];
        var chairNumArray = [];
        var filteredArray = [];

        for (var i = 0; i < records.length; i++) {

            if (records[i].getCellValue(chartNameFieldId) == chartName) {

                filteredArray.push(records[i]);

                if (records[i].getCellValue(tableNumFieldId) > maxTableNum) {
                    maxTableNum = records[i].getCellValue(tableNumFieldId);
                }

                if (records[i].getCellValue(chairNumFieldId) > maxChairNum) {
                    maxChairNum = records[i].getCellValue(chairNumFieldId);
                }
            }
        }

        if (filteredArray.length == 0 || maxChairNum == 0 || maxTableNum == 0) {
            errorMessage = "That chart could not be found. Please try a different name.";
        } else {

            chart = renderSeatingChart(filteredArray,  maxTableNum, maxChairNum, guestNameFieldId, chairNumFieldId, tableNumFieldId);
        }

    }


    if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <div>
            Before proceeding with loading saved data you must fill out some information.
            <SettingsComponent />

            </div>;
    } else {
        return <div>
            <FormField label="Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>

            <Button onClick={e => setRenderChart(true)} disabled={buttonDisabled} icon="download">
                Load Chart
            </Button>

            {renderChart && errorMessage}

            {renderChart && <div>{chart}</div>}

        </div>;
    }

}

// Create seating chart automatic backend function

function seatingAutomation(records, numTables, numChairs) {
    console.log("Automated seating chart");

    // if no relationships, seat at random table with other people with no relationships

    // sort records by table number and then by seat

    // call seating chart map creation with number of tables and chairs
    const chart = renderSeatingChart(records, numTables, numChairs);

    return <div>{chart}</div>;
}

// Render the seating chart

function renderSeatingChart(records, numTables, numChairs, guestNameFieldId, chairNumFieldId, tableNumFieldId) {

    //test seating chart for breaking
    if (records.length <= numTables * numChairs) {
        var numberArray = [];
        var filteredRecords = [];

        for (var i = 0; i < numTables; i++) {
            numberArray.push(i + 1);
        }
        console.log(numberArray);

        var formattedRecords =

            numberArray.map((value, index) => {

                return <div key="index"><h2>Table {value}</h2><ol>

                records.map((value2, index2) => {

                    (value2.getCellValue(tableNumFieldId) == {value2}) ?
                    <li key={index2}> value2.getCellValueAsString(guestNameFieldId)</li> : <li></li>

                })

                </ol></div>;
        })

        console.log(formattedRecords);

        return <div>
            {formattedRecords}
        </div>;
    } else {
        return "Sorry, the chart can't be generated at this time.";
    }
}

// Save seating chart data to file

function saveSeatingChartData(records) {
    const [isShowingSettings, setIsShowingSettings] = useState(false);

    useSettingsButton(function() {
        setIsShowingSettings(!isShowingSettings);
    })

    const base = useBase();
    const globalConfig = useGlobalConfig();

    const dataTableId = globalConfig.get('dataTableId');
    const guestNameFieldId = globalConfig.get('guestNameFieldId');
    const chartNameFieldId = globalConfig.get('chartNameFieldId');
    const tableNumFieldId = globalConfig.get('tableNumFieldId');
    const chairNumFieldId = globalConfig.get('chairNumFieldId');

    const dataTable = base.getTableByIdIfExists(dataTableId);
    const chartNameField = dataTable.getFieldByIdIfExists(chartNameFieldId);

    const [chartName, setChartName] = useState("");

    //warn if name trying to save to is the same as current name (will mess up file?)

    var buttonDisabled = true;

    if (chartName == "" || chartName == null) {

    } else {
        buttonDisabled = false;
    }

    if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <div>
            Before proceeding with saving data you must fill out some information.
            <SettingsComponent />

            </div>;
    } else {
        return <div>
            <FormField label="New Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>

            <Button onClick={e => setRenderChart(true)} disabled={buttonDisabled} icon="upload">
                Save Records
            </Button>

        </div>;
    }
}

initializeBlock(() => <SeatingChartBlock />);
