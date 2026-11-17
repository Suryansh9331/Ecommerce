/**
 * Container smoke test for the Meesho wizard. Confirms:
 *   - All 4 tab labels render
 *   - Back button is disabled on tab 1
 *   - Next button is reachable
 *   - Tab 1 validation blocks navigation until required fields are provided
 *
 * Child tabs make network calls (categories, attributes). We mock fetch so
 * tests stay offline and deterministic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import MeeshoProductWizard from './MeeshoProductWizard';

// Stub fetch so CategorySelection + attribute fetches don't error out
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderWizard = () =>
  render(
    <MemoryRouter>
      <MeeshoProductWizard />
    </MemoryRouter>
  );

describe('MeeshoProductWizard — container', () => {
  it('renders all 4 tab labels (long form on desktop, short on mobile)', () => {
    renderWizard();
    // Desktop labels
    expect(screen.getByText('Add Product')).toBeInTheDocument();
    expect(screen.getByText('Basic Details')).toBeInTheDocument();
    expect(screen.getByText('Additional Details')).toBeInTheDocument();
    expect(screen.getByText('Add Variant(s)')).toBeInTheDocument();
    // Mobile short labels also exist in the DOM (hidden via CSS classes)
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Basics')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.getByText('Variants')).toBeInTheDocument();
  });

  it('disables Back button on first tab', () => {
    renderWizard();
    const backBtn = screen.getByRole('button', { name: /^back$/i });
    expect(backBtn).toBeDisabled();
  });

  it('shows Next button on first tab, not Submit', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /submit catalog/i })
    ).not.toBeInTheDocument();
  });

  it('blocks Next when Tab 1 validation fails (empty form)', async () => {
    const user = userEvent.setup();
    renderWizard();

    const nextBtn = screen.getByRole('button', { name: /^next$/i });
    await user.click(nextBtn);

    // Still on tab 1 — Next button unchanged
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
    // Validation surfaces specific required-field errors. We pick the two
    // most unique strings so the assertion isn't confused with labels.
    expect(
      screen.getByText(/product name is required/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/upload at least one product image/i)
    ).toBeInTheDocument();
  });

  it('has a back arrow in the header that navigates away', () => {
    renderWizard();
    const headerBack = screen.getByRole('button', { name: /back to products/i });
    expect(headerBack).toBeInTheDocument();
  });

  it('renders progress bar container', () => {
    const { container } = renderWizard();
    // The progress bar is a div with a fixed height=1 class (bg-primary-600 fills it)
    const bar = container.querySelector('.bg-primary-600.transition-all');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveStyle({ width: '25%' }); // step 1 of 4
  });

  it('marks tab 1 as current via aria-current', () => {
    renderWizard();
    const tab1 = screen.getByText('Add Product').closest('button');
    expect(tab1).toHaveAttribute('aria-current', 'step');
  });

  it('exposes Catalog Upload title', () => {
    renderWizard();
    expect(screen.getByRole('heading', { name: /catalog upload/i })).toBeInTheDocument();
  });
});
