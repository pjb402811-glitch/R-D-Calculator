import React, { useState, useMemo, useCallback } from 'react';
import Icon from './Icon';
import InputGroup from './InputGroup';
import ResultItem from './ResultItem';
import type { SplitPurchaseResultRow, SplitPurchaseSummary } from '../types';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { parseFormattedNumber, formatNumberString } from '../utils/formatters';


const SplitPurchaseSimulator: React.FC = () => {
    const [itemName, setItemName] = useLocalStorageState('split_itemName', '');
    const [currentPrice, setCurrentPrice] = useLocalStorageState('split_currentPrice', '0');
    const [totalCapital, setTotalCapital] = useLocalStorageState('split_totalCapital', '0');
    const [splitCount, setSplitCount] = useLocalStorageState('split_splitCount', '0');
    const [dropRate, setDropRate] = useLocalStorageState('split_dropRate', '0');
    const [martingaleMultiplier, setMartingaleMultiplier] = useLocalStorageState('split_martingaleMultiplier', '0');

    const [activeTab, setActiveTab] = useLocalStorageState<'equal' | 'martingale'>('split_activeTab', 'equal');
    
    const [results, setResults] = useLocalStorageState<{ equal: { rows: SplitPurchaseResultRow[], summary: SplitPurchaseSummary }, martingale: { rows: SplitPurchaseResultRow[], summary: SplitPurchaseSummary }} | null>('split_results', null);

    const [executedRows, setExecutedRows] = useLocalStorageState<Record<number, boolean>>('split_executedRows', {});


    const handleCalculate = useCallback(() => {
        const price = parseFormattedNumber(currentPrice);
        const capital = parseFormattedNumber(totalCapital);
        const count = parseInt(splitCount, 10);
        const rate = parseFloat(dropRate);
        const multiplier = parseFloat(martingaleMultiplier);

        if ([price, capital, count, rate, multiplier].some(v => isNaN(v) || v <= 0)) {
            alert("모든 입력값은 0보다 큰 숫자여야 합니다.");
            return;
        }

        // Equal Split Calculation
        const equalRows: SplitPurchaseResultRow[] = [];
        const amountPerSplit = capital / count;
        let cumulativeAmountEq = 0;
        let cumulativeQtyEq = 0;
        for (let i = 1; i <= count; i++) {
            const entryPrice = price * Math.pow(1 - rate / 100, i - 1);
            const entryAmount = amountPerSplit;
            const quantity = entryAmount / entryPrice;
            cumulativeAmountEq += entryAmount;
            cumulativeQtyEq += quantity;
            const averagePrice = cumulativeAmountEq / cumulativeQtyEq;
            equalRows.push({ round: i, entryPrice, entryAmount, quantity, cumulativeEntryAmount: cumulativeAmountEq, cumulativeQuantity: cumulativeQtyEq, averagePrice });
        }
        const equalSummary: SplitPurchaseSummary = {
            finalAveragePrice: equalRows[equalRows.length - 1].averagePrice,
            totalEntryAmount: capital,
            totalHeldQuantity: equalRows[equalRows.length - 1].cumulativeQuantity
        };

        // Martingale Split Calculation
        const martingaleRows: SplitPurchaseResultRow[] = [];
        let sumOfWeights = 0;
        if (multiplier === 1) {
            sumOfWeights = count;
        } else {
            sumOfWeights = (Math.pow(multiplier, count) - 1) / (multiplier - 1);
        }
        const baseAmount = capital / sumOfWeights;
        let cumulativeAmountMg = 0;
        let cumulativeQtyMg = 0;
        for (let i = 1; i <= count; i++) {
            const entryPrice = price * Math.pow(1 - rate / 100, i - 1);
            const entryAmount = baseAmount * Math.pow(multiplier, i - 1);
            const quantity = entryAmount / entryPrice;
            cumulativeAmountMg += entryAmount;
            cumulativeQtyMg += quantity;
            const averagePrice = cumulativeAmountMg / cumulativeQtyMg;
            martingaleRows.push({ round: i, entryPrice, entryAmount, quantity, cumulativeEntryAmount: cumulativeAmountMg, cumulativeQuantity: cumulativeQtyMg, averagePrice });
        }
        const martingaleSummary: SplitPurchaseSummary = {
            finalAveragePrice: martingaleRows[martingaleRows.length - 1].averagePrice,
            totalEntryAmount: capital,
            totalHeldQuantity: martingaleRows[martingaleRows.length - 1].cumulativeQuantity
        };
        
        setResults({ equal: { rows: equalRows, summary: equalSummary }, martingale: { rows: martingaleRows, summary: martingaleSummary }});
        setExecutedRows({});
    }, [currentPrice, totalCapital, splitCount, dropRate, martingaleMultiplier, setResults, setExecutedRows]);

    const handleReset = () => {
        setItemName('');
        setCurrentPrice('0');
        setTotalCapital('0');
        setSplitCount('0');
        setDropRate('0');
        setMartingaleMultiplier('0');
        setResults(null);
        setExecutedRows({});
        setActiveTab('equal');
        // Manually clear all related localStorage items
        localStorage.removeItem('split_itemName');
        localStorage.removeItem('split_currentPrice');
        localStorage.removeItem('split_totalCapital');
        localStorage.removeItem('split_splitCount');
        localStorage.removeItem('split_dropRate');
        localStorage.removeItem('split_martingaleMultiplier');
        localStorage.removeItem('split_results');
        localStorage.removeItem('split_executedRows');
        localStorage.removeItem('split_activeTab');
    };

    const handleSave = () => {
        if (results) {
            // The custom hook already saves on state change, so we just need to give feedback.
            alert('계산 결과가 저장되었습니다.');
        } else {
            alert('저장할 계산 결과가 없습니다. 먼저 계산을 실행해주세요.');
        }
    };

    const handleExecutionChange = (round: number) => {
        setExecutedRows(prev => ({...prev, [round]: !prev[round]}));
    };

    const displayedData = useMemo(() => {
        if (!results) return null;
        return activeTab === 'equal' ? results.equal : results.martingale;
    }, [results, activeTab]);

    const summaryData = useMemo(() => {
        if (!displayedData) return null;

        const executedRounds = displayedData.rows.filter(row => executedRows[row.round]);
        if (executedRounds.length === 0) {
            // If no rows are checked, show the summary for all rows
            return {
                finalAveragePrice: displayedData.summary.finalAveragePrice,
                totalEntryAmount: displayedData.summary.totalEntryAmount,
                totalHeldQuantity: displayedData.summary.totalHeldQuantity
            };
        }

        const totalEntryAmount = executedRounds.reduce((sum, row) => sum + row.entryAmount, 0);
        const totalHeldQuantity = executedRounds.reduce((sum, row) => sum + row.quantity, 0);
        const finalAveragePrice = totalHeldQuantity > 0 ? totalEntryAmount / totalHeldQuantity : 0;
        
        return { finalAveragePrice, totalEntryAmount, totalHeldQuantity };
    }, [displayedData, executedRows]);

    return (
        <div className="section">
            <div className="input-grid-3-col">
                <InputGroup label="종목명" htmlFor="itemName">
                    <input id="itemName" type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </InputGroup>
                <InputGroup label="현재 가격" htmlFor="currentPrice">
                    <input id="currentPrice" type="text" value={currentPrice} onChange={(e) => setCurrentPrice(formatNumberString(e.target.value))} inputMode="decimal" />
                </InputGroup>
                <InputGroup label="총 자본" htmlFor="totalCapital">
                    <input id="totalCapital" type="text" value={totalCapital} onChange={(e) => setTotalCapital(formatNumberString(e.target.value))} inputMode="decimal" />
                </InputGroup>
                <InputGroup label="분할 횟수" htmlFor="splitCount">
                    <input id="splitCount" type="number" value={splitCount} onChange={(e) => setSplitCount(e.target.value)} />
                </InputGroup>
                <InputGroup label="분할당 하락률 (%)" htmlFor="dropRate">
                    <input id="dropRate" type="number" value={dropRate} onChange={(e) => setDropRate(e.target.value)} step="0.1" />
                </InputGroup>
                <InputGroup label="마틴게일 배수" htmlFor="martingaleMultiplier">
                    <input id="martingaleMultiplier" type="number" value={martingaleMultiplier} onChange={(e) => setMartingaleMultiplier(e.target.value)} step="0.1" />
                </InputGroup>
            </div>

            <div className="action-buttons-container">
                <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <button onClick={handleCalculate} className="calculate-button"><Icon name="play" className="mr-2" /> 계산</button>
                    <button onClick={handleSave} className="save-button"><Icon name="save" className="mr-2" /> 저장</button>
                    <button onClick={handleReset} className="reset-button"><Icon name="undo" className="mr-2" /> 초기화</button>
                </div>
            </div>
            
            {results && summaryData && displayedData && (
                <div className="result-section mt-8">
                    <h2 className="!border-b-0 split-sim-results-header"><Icon name="table-list" /> 계산 결과</h2>
                    
                    <div className="tabs-container">
                        <button className={`tab-button split-sim-tab-button ${activeTab === 'equal' ? 'active' : ''}`} onClick={() => setActiveTab('equal')}>균등 분할</button>
                        <button className={`tab-button split-sim-tab-button ${activeTab === 'martingale' ? 'active' : ''}`} onClick={() => setActiveTab('martingale')}>마틴게일 분할</button>
                    </div>

                    <div className="results-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <ResultItem label="최종 평단가" value={summaryData.finalAveragePrice.toLocaleString(undefined, { maximumFractionDigits: 8 })} />
                        <ResultItem label="총 진입 금액" value={summaryData.totalEntryAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                        <ResultItem label="총 보유 수량" value={summaryData.totalHeldQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} />
                    </div>

                    <div className="result-table-container mt-6">
                        <table className="result-table">
                           <thead>
                                <tr>
                                    <th>실행</th>
                                    <th>회차</th>
                                    <th>진입 가격</th>
                                    <th>진입 금액</th>
                                    <th>수량</th>
                                    <th>누적 진입액</th>
                                    <th>누적 수량</th>
                                    <th>평단가</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedData.rows.map(row => (
                                    <tr key={row.round}>
                                        <td><input type="checkbox" checked={!!executedRows[row.round]} onChange={() => handleExecutionChange(row.round)} /></td>
                                        <td>{row.round}</td>
                                        <td>{row.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                                        <td>{row.entryAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td>{row.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                                        <td>{row.cumulativeEntryAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td>{row.cumulativeQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                                        <td>{row.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SplitPurchaseSimulator;