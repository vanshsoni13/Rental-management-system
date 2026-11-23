import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, AlertTriangle, Info, Calculator, CheckCircle2, RefreshCw } from 'lucide-react';

const CreditDebitLedger = ({ initialDeposit = 5000, damageAmount = 1500, fineReason = 'Lens Glass Scratch', showSimulator = true }) => {
  // Interactive Simulator state
  const [simDeposit, setSimDeposit] = useState(initialDeposit);
  const [simDamage, setSimDamage] = useState(damageAmount);
  const [simReason, setSimReason] = useState(fineReason);
  const [activeTab, setActiveTab] = useState('example'); // 'example' | 'simulator'

  // Calculate live figures
  const depVal = Math.max(0, parseFloat(simDeposit || 0));
  const damVal = Math.min(depVal, Math.max(0, parseFloat(simDamage || 0)));
  const refundVal = Math.max(0, depVal - damVal);

  const presetScenarios = [
    { title: 'Normal Return (No Damage)', deposit: 5000, damage: 0, reason: 'Good Condition' },
    { title: 'Minor Scratch / Partial Damage', deposit: 5000, damage: 1500, reason: 'Body/Glass Scratched' },
    { title: 'Severe Damage / Full Loss', deposit: 5000, damage: 5000, reason: 'Water Damage / Lost Item' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              Financial Breakdown
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wide">
              Credit & Debit System
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-1">Security Deposit Credit & Debit Ledger</h2>
          <p className="text-xs text-gray-500">
            Understand how money paid (Credited), money taken by owner for damages (Debited), and remaining deposit returned (Credited) work.
          </p>
        </div>

        {showSimulator && (
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('example')}
              className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'example' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Visual Example
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1 ${activeTab === 'simulator' ? 'bg-sky-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Calculator</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'example' ? (
        <div className="space-y-6">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-gray-400 self-center mr-1">Sample Scenarios:</span>
            {presetScenarios.map((sc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSimDeposit(sc.deposit);
                  setSimDamage(sc.damage);
                  setSimReason(sc.reason);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  simDeposit === sc.deposit && simDamage === sc.damage
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          {/* Step-by-Step Credit / Debit Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Deposit Paid (Credit) */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Step 1: Tenant Paid</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> CREDIT (+)
                </span>
              </div>
              <h4 className="text-sm font-bold text-emerald-950">Security Deposit Received</h4>
              <div className="text-2xl font-black text-emerald-700">₹{depVal.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Customer deposits full refundable amount before rental starts.
              </p>
            </div>

            {/* 2. Damage Deduction (Debit) */}
            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Step 2: Owner Takes</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white">
                  <ArrowDownLeft className="w-3 h-3 mr-0.5" /> DEBIT (-)
                </span>
              </div>
              <h4 className="text-sm font-bold text-rose-950">Damage Charge Deducted</h4>
              <div className="text-2xl font-black text-rose-700">-₹{damVal.toLocaleString()}</div>
              <p className="text-[11px] text-rose-800 leading-tight">
                {damVal > 0 ? `Money taken by owner for: ${simReason}` : 'No damages! ₹0 taken by owner.'}
              </p>
            </div>

            {/* 3. Remaining Deposit (Credit Back) */}
            <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-sky-800 tracking-wider">Step 3: Tenant Receives</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-600 text-white">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> CREDIT (+)
                </span>
              </div>
              <h4 className="text-sm font-bold text-sky-950">Remaining Refund Given</h4>
              <div className="text-2xl font-black text-sky-700">₹{refundVal.toLocaleString()}</div>
              <p className="text-[11px] text-sky-800 leading-tight">
                Net remaining deposit amount credited back to tenant's bank/account.
              </p>
            </div>

          </div>

          {/* Formula Banner */}
          <div className="p-4 bg-gray-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>
                <strong>Net Refund (CREDIT)</strong> = Initial Deposit (<span className="text-emerald-400">+₹{depVal}</span>) - Owner Damage (<span className="text-rose-400">-₹{damVal}</span>)
              </span>
            </div>
            <div className="text-sm font-bold text-sky-300">
              = ₹{refundVal.toLocaleString()} (Refunded to Tenant)
            </div>
          </div>

        </div>
      ) : (
        /* Interactive Simulator Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Security Deposit (₹)</label>
              <input
                type="number"
                min={0}
                value={simDeposit}
                onChange={(e) => setSimDeposit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Owner Damage Fine (₹)</label>
              <input
                type="number"
                min={0}
                value={simDamage}
                onChange={(e) => setSimDamage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-rose-900 focus:ring-2 focus:ring-rose-500 bg-rose-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason / Description</label>
              <input
                type="text"
                value={simReason}
                onChange={(e) => setSimReason(e.target.value)}
                placeholder="e.g. Broken screen"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Live Output */}
          <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">Live Settlement Computation</h4>
            
            <div className="space-y-2 text-xs divide-y divide-gray-700">
              <div className="flex justify-between py-1.5">
                <span className="text-gray-300">Initial Deposit Paid by Customer:</span>
                <span className="font-bold text-emerald-400">+₹{depVal.toLocaleString()} (CREDIT)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-300">Money Taken by Owner for Damage ({simReason || 'Damage'}):</span>
                <span className="font-bold text-rose-400">-₹{damVal.toLocaleString()} (DEBIT)</span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-sm">
                <span className="text-white">Net Remaining Amount Given to Customer:</span>
                <span className="font-black text-sky-300">+₹{refundVal.toLocaleString()} (CREDITED)</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreditDebitLedger;
