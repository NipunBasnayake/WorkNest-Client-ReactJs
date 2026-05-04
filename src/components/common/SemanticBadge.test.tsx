import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SemanticBadge } from './SemanticBadge';

describe('SemanticBadge', () => {
  describe('variants', () => {
    it('renders success variant', () => {
      render(<SemanticBadge label="Success" variant="success" />);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
      render(<SemanticBadge label="Warning" variant="warning" />);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders danger variant', () => {
      render(<SemanticBadge label="Danger" variant="danger" />);
      expect(screen.getByText('Danger')).toBeInTheDocument();
    });

    it('renders info variant', () => {
      render(<SemanticBadge label="Info" variant="info" />);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('renders neutral variant', () => {
      render(<SemanticBadge label="Neutral" variant="neutral" />);
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });
  });

  describe('label', () => {
    it('renders label text', () => {
      render(<SemanticBadge label="Test Label" variant="success" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('renders label inside span', () => {
      const { container } = render(
        <SemanticBadge label="Wrapped" variant="success" />
      );
      const labelSpan = container.querySelector('span span');
      expect(labelSpan?.textContent).toBe('Wrapped');
    });
  });

  describe('dot indicator', () => {
    it('renders dot when showDot=true', () => {
      const { container } = render(
        <SemanticBadge label="With Dot" variant="success" showDot={true} />
      );
      const dots = container.querySelectorAll('.h-1\\.5');
      expect(dots.length).toBeGreaterThan(0);
    });

    it('does not render dot when showDot=false (default)', () => {
      const { container } = render(
        <SemanticBadge label="No Dot" variant="success" />
      );
      // Query for elements with h-1.5 and w-1.5 (the dot size classes)
      const potentialDots = container.querySelectorAll('.h-1\\.5.w-1\\.5');
      expect(potentialDots.length).toBe(0);
    });

    it('dot is aria-hidden', () => {
      const { container } = render(
        <SemanticBadge label="With Dot" variant="success" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });

    it('dot has rounded-full class', () => {
      const { container } = render(
        <SemanticBadge label="With Dot" variant="success" showDot={true} />
      );
      const dot = container.querySelector('.rounded-full[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('merges additional className', () => {
      const { container } = render(
        <SemanticBadge
          label="Custom"
          variant="success"
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('preserves base classes when className is added', () => {
      const { container } = render(
        <SemanticBadge
          label="Custom"
          variant="success"
          className="custom-class"
        />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('rounded-full', 'text-xs', 'font-semibold');
    });
  });

  describe('title attribute', () => {
    it('passes through title attribute', () => {
      const { container } = render(
        <SemanticBadge
          label="With Title"
          variant="success"
          title="Tooltip text"
        />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.getAttribute('title')).toBe('Tooltip text');
    });

    it('works without title', () => {
      const { container } = render(
        <SemanticBadge label="No Title" variant="success" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge.getAttribute('title')).toBeNull();
    });
  });

  describe('styling', () => {
    it('applies success colors', () => {
      const { container } = render(
        <SemanticBadge label="Success" variant="success" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle('background: rgba(34,197,94,0.12)');
      expect(badge).toHaveStyle('color: #16a34a');
    });

    it('applies warning colors', () => {
      const { container } = render(
        <SemanticBadge label="Warning" variant="warning" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle('background: rgba(245,158,11,0.12)');
      expect(badge).toHaveStyle('color: #d97706');
    });

    it('applies danger colors', () => {
      const { container } = render(
        <SemanticBadge label="Danger" variant="danger" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle('background: rgba(239,68,68,0.12)');
      expect(badge).toHaveStyle('color: #dc2626');
    });

    it('applies info colors (blue, not purple)', () => {
      const { container } = render(
        <SemanticBadge label="Info" variant="info" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle('background: rgba(59,130,246,0.12)');
      expect(badge).toHaveStyle('color: #2563eb');
    });

    it('applies neutral colors', () => {
      const { container } = render(
        <SemanticBadge label="Neutral" variant="neutral" />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveStyle('background: rgba(100,116,139,0.12)');
      expect(badge).toHaveStyle('color: #475569');
    });

    it('has inline-flex display', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" />
      );
      expect(container.firstChild).toHaveClass('inline-flex');
    });

    it('has items-center alignment', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" />
      );
      expect(container.firstChild).toHaveClass('items-center');
    });

    it('has rounded-full shape', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" />
      );
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('has px-2.5 py-1 padding', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" />
      );
      expect(container.firstChild).toHaveClass('px-2.5', 'py-1');
    });

    it('has text-xs font-semibold typography', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" />
      );
      expect(container.firstChild).toHaveClass('text-xs', 'font-semibold');
    });

    it('has gap-1.5 when dot is shown', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" showDot={true} />
      );
      expect(container.firstChild).toHaveClass('gap-1.5');
    });

    it('does not have gap-1.5 when dot is not shown', () => {
      const { container } = render(
        <SemanticBadge label="Test" variant="success" showDot={false} />
      );
      expect(container.firstChild).not.toHaveClass('gap-1.5');
    });
  });

  describe('dot color matching text', () => {
    it('success dot color matches text', () => {
      const { container } = render(
        <SemanticBadge label="Success" variant="success" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(dot).toHaveStyle('background: #16a34a');
    });

    it('warning dot color matches text', () => {
      const { container } = render(
        <SemanticBadge label="Warning" variant="warning" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(dot).toHaveStyle('background: #d97706');
    });

    it('danger dot color matches text', () => {
      const { container } = render(
        <SemanticBadge label="Danger" variant="danger" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(dot).toHaveStyle('background: #dc2626');
    });

    it('info dot color matches text', () => {
      const { container } = render(
        <SemanticBadge label="Info" variant="info" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(dot).toHaveStyle('background: #2563eb');
    });

    it('neutral dot color matches text', () => {
      const { container } = render(
        <SemanticBadge label="Neutral" variant="neutral" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(dot).toHaveStyle('background: #475569');
    });
  });

  describe('accessibility', () => {
    it('label is readable by screen readers', () => {
      render(<SemanticBadge label="Status" variant="success" />);
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('dot is hidden from screen readers', () => {
      const { container } = render(
        <SemanticBadge label="Status" variant="success" showDot={true} />
      );
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot?.getAttribute('aria-hidden')).toBe('true');
    });

    it('supports title for tooltip/accessibility', () => {
      const { container } = render(
        <SemanticBadge
          label="Approved"
          variant="success"
          title="Request approved by admin"
        />
      );
      expect(container.firstChild).toHaveAttribute(
        'title',
        'Request approved by admin'
      );
    });
  });

  describe('edge cases', () => {
    it('handles long labels', () => {
      render(
        <SemanticBadge
          label="This is a very long label that might wrap"
          variant="success"
        />
      );
      expect(screen.getByText('This is a very long label that might wrap')).toBeInTheDocument();
    });

    it('handles empty className', () => {
      const { container } = render(
        <SemanticBadge
          label="Test"
          variant="success"
          className=""
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles both showDot and custom className', () => {
      const { container } = render(
        <SemanticBadge
          label="Complex"
          variant="success"
          showDot={true}
          className="custom-class"
        />
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('gap-1.5', 'custom-class');
    });
  });
});
