//add styling, full screen vs. small screen,
//add view options for tables
//check permissions
//remove allow pick none
//add error messages for disabled buttons
//add comments
//test render chart with bad values
//error on home page screen
//test errors for load seating chart
//test errors for new seating chart
//seating chart automation
//saving seating chart data to file
//forward, back, and home buttons
//figure out how to exit loops early (try to optimize other algorithms)
//add loading icons?
//add info and dialog boxes
//restrict necessary fields from useRecords

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
    const originalGuestNameFieldId = globalConfig.get('originalGuestNameFieldId');

    const guestTable = base.getTableByIdIfExists(guestTableId);

    const [numTables, setTableValue] = useState("");
    const [numChairs, setChairValue] = useState("");

    // disable Generate Seating Chart button until fields are filled
    const buttonDisabled = numTables <= 0 || numTables == null || numChairs <= 0 ||  numChairs == null || guestTable == null || relationshipFieldId == null || originalGuestNameFieldId == null;

    // note if number of guests exceeds capacity given
    var errorMessage = "";

    var records = useRecords(guestTable);

    if (!buttonDisabled && numTables != null && numChairs != null && records.length > numTables * numChairs) {
        errorMessage = "You do not have enough capacity to seat all your guests. If you click Generate Seating Chart, a chart will generate using the first " + numTables * numChairs + " people on your list.";
    }

    const [generateChart, setGenerateChart] = useState(false);

    var chart;
    var finalRecords;

    if (generateChart) {
        finalRecords = seatingAutomation(records, numTables, numChairs, relationshipFieldId, originalGuestNameFieldId);
        chart = renderSeatingChart(finalRecords, numTables, numChairs);
    }

    const [saveChartData, setSaveChartData] = useState(false);

    if (saveChartData) {
        return <SaveSeatingChartData record={finalRecords} />;
    } else {

        return <div>
            <Label htmlFor="guest-table-picker">Select table that contains guest data</Label>
            <TablePickerSynced id="guest-table-picker" globalConfigKey="guestTableId" />
            <Label htmlFor="original-guest-name-field-picker">Select field that contains the name for each guest</Label>
            <FieldPickerSynced id="original-guest-name-field-picker" table={guestTable} globalConfigKey="originalGuestNameFieldId" />
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
            {generateChart && <Button onClick={() => setSaveChartData(true)} icon="upload">
                Store Data
            </Button>}
        </div>;
    }
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

        var name = "";

        for (var j = 0; j < maxTableNum * maxChairNum; j++) {
            console.log(maxTableNum * maxChairNum);
            for (var k = 0; k < filteredArray.length; k++) {
                console.log("Table: " + (Math.floor(j / maxChairNum) + 1) + " Chair: " + ((j % maxChairNum) + 1));
                if (filteredArray[k].getCellValue(tableNumFieldId) == (Math.floor(j / maxChairNum) + 1) && filteredArray[k].getCellValue(chairNumFieldId) == ((j % maxChairNum) + 1)) {
                    name = filteredArray[k].getCellValueAsString(guestNameFieldId);
                }
            }

            guestNameArray.push(name);
            name = "";
        }

        if (filteredArray.length == 0 || maxChairNum == 0 || maxTableNum == 0) {
            errorMessage = "That chart could not be found. Please try a different name.";
        } else {

            chart = renderSeatingChart(guestNameArray, maxTableNum, maxChairNum);
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

function seatingAutomation(records, numTables, numChairs, relationshipFieldId, originalGuestNameFieldId) {

    var finalRecords = [];

    for (var i = 0; i < numTables * numChairs; i++) {
        if (records[i] != null) {
            finalRecords.push(records[i].getCellValueAsString(originalGuestNameFieldId));
        } else {
            finalRecords.push("");
        }
    }

    // if no relationships, seat at random table with other people with no relationships

    // sort records by table number and then by seat

    return finalRecords;
}

// Render the seating chart

function renderSeatingChart(guestNameArray, numTables, numChairs) {

    if (guestNameArray.length == numTables * numChairs) {
        var tableArray = [];

        for (var i = 0; i < numTables; i++) {
            tableArray.push(i);
        }

        var chairArray = [];

        for (var j = 0; j < numChairs; j++) {
            chairArray.push(j);
        }

        var test = 0;

        var formattedRecords =

            tableArray.map((tableValue, tableIndex) => {

                return <div key={tableIndex}><h2>Table {tableValue + 1}</h2><ol>

                {chairArray.map((chairValue, chairIndex) => {
                    test = (tableValue * numChairs) + chairValue;

                    return <li key={chairIndex}>{guestNameArray[test]}

                    </li>
                })}

                </ol></div>;
        })

        return <div>
            {formattedRecords}
        </div>;
    } else {
        return "Sorry, the chart can't be generated at this time.";
    }
}

// Save seating chart data to file

function SaveSeatingChartData(props) {
    const [isShowingSettings, setIsShowingSettings] = useState(false);

    var records = props.records;

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

    var buttonDisabled = true;

    if (chartName == "" || chartName == null) {

    } else {
        buttonDisabled = false;
    }

    const [saveData, setSaveData] = useState(false);

    const seatingChartRecords = useRecords(dataTable, {fields: [chartNameFieldId]});

    var chartNameWillBeOverwritten = false;

    if (saveData) {
        for (var i = 0; i < seatingChartRecords.length; i++) {
            if (seatingChartRecords[i].getCellValueAsString(chartNameFieldId) == chartName) {
                chartNameWillBeOverwritten = true;
            } else {

            }
        }
    }

    if (saveData && !chartNameWillBeOverwritten) {
        //save the data;
        const batchSize = 50;

        var recordsToUpdate = [];

        if (recordsToUpdate.length < 50) {
            dataTable.createRecordsAsync(recordsToUpdate);
        } else {
            var i = 0;
            while (i < recordsToUpdate.length) {
                const updateBatch = recordsToUpdate.slice(i, i + batchSize);

                await dataTable.createRecordsAsync(recordsToUpdate);

                i += batchSize;
            }
        }
    }

    if (dataTableId == null || guestNameFieldId == null || chartNameFieldId == null || tableNumFieldId == null || chairNumFieldId == null) {
        return <div>
            Before proceeding with saving data you must fill out some information.
            <SettingsComponent />

            </div>;
    } else if (saveData && !chartNameWillBeOverwritten) {
        return <div>Saving Records</div>;
    } else {
        return <div>
            <FormField label="New Seating Chart Name">
                <Input value={chartName} required={true} onChange={e => setChartName(e.target.value)} />
            </FormField>

            <Button onClick={e => setSaveData(true)} disabled={buttonDisabled} icon="upload">
                Save Records
            </Button>

            {chartNameWillBeOverwritten && "That chart name is already in use. Please choose another name."}

        </div>;
    }
}

initializeBlock(() => <SeatingChartBlock />);
