import React from 'react';

// Lightweight stand-ins for the @els/* design-system components used across
// the app. These are third-party, presentational-only in our usage — tests
// exercise our app logic (conditionals, data flow, routing), not the design
// system's internals, so real components would only add jsdom-compatibility
// noise (media queries, portals, sprite loading) without adding test value.

export const Card = ({
    children,
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className} {...rest}>
        {children}
    </div>
);

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    htmlType?: 'button' | 'submit' | 'reset';
    type?: string;
}

export const Button = ({ children, htmlType, type, ...rest }: ButtonProps) => (
    <button type={htmlType ?? 'button'} data-variant={type} {...rest}>
        {children}
    </button>
);

export const Badge = ({
    content,
    type,
}: {
    content: React.ReactNode;
    type?: string;
}) => (
    <span data-testid="badge" data-variant={type}>
        {content}
    </span>
);

export const Pill = ({
    children,
    pillColor,
    textColor,
}: {
    children: React.ReactNode;
    pillColor?: string;
    textColor?: string;
}) => (
    <span data-testid="pill" data-pill-color={pillColor} data-text-color={textColor}>
        {children}
    </span>
);

interface IconProps {
    isDecorative?: boolean;
    size?: string;
    sprite?: string;
}

export const Icon = ({ isDecorative, sprite }: IconProps) => (
    <i aria-hidden={isDecorative ? 'true' : undefined} data-sprite={sprite} />
);
Icon.Sprites = {
    CHEVRON_RIGHT: 'chevron-right',
    CHEVRON_LEFT: 'chevron-left',
    PLAY_SOLID: 'play-solid',
};

export const Header = ({
    wordmark,
    wordmarkLink,
    children,
}: {
    wordmark?: React.ReactNode;
    wordmarkLink?: { href: string; 'aria-label'?: string };
    children?: React.ReactNode;
    [key: string]: unknown;
}) => (
    <header>
        <a href={wordmarkLink?.href} aria-label={wordmarkLink?.['aria-label']}>
            {wordmark}
        </a>
        {children}
    </header>
);

export const Footer = ({ legalEntity }: { legalEntity?: string; [key: string]: unknown }) => (
    <footer>{legalEntity}</footer>
);
